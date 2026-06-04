import { NextResponse } from "next/server";
import { createPublicClient, defineChain, getAddress, http, isAddress, type Address, type PublicClient } from "viem";

import { ARC_TESTNET_CHAIN_ID } from "@/config/env";
import { contractAbis, contractAddresses, deploymentConfig } from "@/config/contracts";
import { parseExternalReferenceMetadata } from "@/features/discovery/lib/external-reference-matching";
import { mockMarkets } from "@/features/markets/data/mock-markets";
import { parseMarketMetadata, sanitizeMarketTitle } from "@/features/markets/lib/market-metadata";
import type { MarketSummary, MarketSummaryResponse } from "@/features/markets/types/market-summary";
import type { MarketCategory, MarketStatus } from "@/features/markets/types";

const USDC_DECIMALS = 1_000_000;
const ACTIVE_CACHE_MS = 120_000;
const ARC_TESTNET_RPC_URL = "https://rpc.testnet.arc.network";
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const SUMMARY_READ_CONCURRENCY = 6;
const summaryFunctionNames = [
  "title",
  "metadataURI",
  "expirationTime",
  "status",
  "totalYesShares",
  "totalNoShares",
  "totalDeposited"
] as const;
const SUMMARY_READS_PER_MARKET = summaryFunctionNames.length;

let cachedSummary:
  | {
      expiresAt: number;
      response: MarketSummaryResponse;
    }
  | undefined;
let lastSuccessfulSummary: MarketSummaryResponse | undefined;
let summaryRefreshInFlight: Promise<void> | undefined;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const shouldRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  if (!shouldRefresh && cachedSummary && cachedSummary.expiresAt > Date.now()) {
    return NextResponse.json(markSummaryAsCached(cachedSummary.response));
  }

  if (!shouldRefresh && cachedSummary) {
    // For normal page reloads, serve stale summary immediately and refresh in the background.
    queueSummaryRefresh();
    return NextResponse.json(markSummaryAsCached(cachedSummary.response, [
      "Serving cached market summary while a background refresh updates Arc Testnet data."
    ]));
  }

  if (deploymentConfig.marketDataMode === "mock" && deploymentConfig.isMockFallbackEnabled) {
    const response = getMockSummaryResponse();

    cachedSummary = {
      expiresAt: Date.now() + ACTIVE_CACHE_MS,
      response
    };

    return NextResponse.json(response);
  }

  const marketFactoryAddress = getSummaryMarketFactoryAddress();

  if (!marketFactoryAddress) {
    return NextResponse.json(
      {
        error: "Arc Testnet MarketFactory is not configured. Set MARKET_FACTORY_ADDRESS or NEXT_PUBLIC_MARKET_FACTORY_ADDRESS."
      },
      { status: 503 }
    );
  }

  try {
    const latestResponse = await getContractSummaryResponse(marketFactoryAddress);
    const response = chooseStableSummary(latestResponse, lastSuccessfulSummary);

    if (isRealSummaryResponse(response)) {
      lastSuccessfulSummary = response;
    }

    cachedSummary = {
      expiresAt: Date.now() + ACTIVE_CACHE_MS,
      response
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Probity market summary read failed", error);

    if (lastSuccessfulSummary) {
      const response = markSummaryAsCached(lastSuccessfulSummary, [
        "Latest Arc Testnet summary refresh failed; serving the last successful real summary."
      ]);

      cachedSummary = {
        expiresAt: Date.now() + ACTIVE_CACHE_MS,
        response
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      {
        error: "Arc Testnet markets could not be loaded. Check MarketFactory configuration or RPC availability."
      },
      { status: 502 }
    );
  }
}

function queueSummaryRefresh() {
  if (summaryRefreshInFlight) {
    return;
  }

  const marketFactoryAddress = getSummaryMarketFactoryAddress();

  if (!marketFactoryAddress) {
    return;
  }

  summaryRefreshInFlight = getContractSummaryResponse(marketFactoryAddress)
    .then((latestResponse) => {
      const response = chooseStableSummary(latestResponse, lastSuccessfulSummary);

      if (isRealSummaryResponse(response)) {
        lastSuccessfulSummary = response;
      }

      cachedSummary = {
        expiresAt: Date.now() + ACTIVE_CACHE_MS,
        response
      };
    })
    .catch((error) => {
      console.warn("Probity market summary background refresh failed", error);
    })
    .finally(() => {
      summaryRefreshInFlight = undefined;
    });
}

async function getContractSummaryResponse(marketFactoryAddress: Address): Promise<MarketSummaryResponse> {
  const rpcUrl = getSummaryRpcUrl();
  const chainId = getSummaryChainId();
  const publicClient = createPublicClient({
    chain: defineChain({
      id: chainId,
      name: chainId === ARC_TESTNET_CHAIN_ID ? "Arc Testnet" : `Chain ${chainId}`,
      nativeCurrency: {
        decimals: 18,
        name: "USD Coin",
        symbol: "USDC"
      },
      rpcUrls: {
        default: {
          http: [rpcUrl]
        }
      },
      contracts: {
        multicall3: {
          address: MULTICALL3_ADDRESS,
          blockCreated: 0
        }
      }
    }),
    transport: http(rpcUrl)
  });
  const marketAddresses = await publicClient.readContract({
    abi: contractAbis.marketFactory,
    address: marketFactoryAddress,
    functionName: "allMarkets"
  }) as Address[];
  const newestFirstAddresses = [...marketAddresses].reverse();
  const contracts = newestFirstAddresses.flatMap((address) => getSummaryContracts(address));
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];
  let summaries: MarketSummary[] = [];

  try {
    const reads = await publicClient.multicall({
      allowFailure: true,
      contracts
    });
    const retryAddresses: Address[] = [];

    summaries = newestFirstAddresses.flatMap((address, index) => {
      const offset = index * SUMMARY_READS_PER_MARKET;
      const marketReads = reads.slice(offset, offset + SUMMARY_READS_PER_MARKET);
      const market = mapSummaryReads(address, marketReads, generatedAt);

      if (!market) {
        retryAddresses.push(address);
      }

      return market ? [market] : [];
    });

    if (retryAddresses.length > 0) {
      const retriedSummaries = await retryMarketSummaries({
        addresses: retryAddresses,
        generatedAt,
        publicClient
      });

      summaries = [...summaries, ...retriedSummaries.summaries];
      warnings.push(...retriedSummaries.warnings);
    }
  } catch (error) {
    console.warn("Probity market summary multicall failed; retrying per market", error);
    warnings.push("Batched market reads failed; returned partial summaries from per-market reads.");

    const retriedSummaries = await retryMarketSummaries({
      addresses: newestFirstAddresses,
      generatedAt,
      publicClient
    });

    summaries = retriedSummaries.summaries;
    warnings.push(...retriedSummaries.warnings);
  }

  if (warnings.length > 0) {
    console.warn("Probity market summary returned partial data", {
      loaded: summaries.length,
      total: marketAddresses.length,
      warnings: warnings.length
    });
  }

  return {
    generatedAt,
    isUsingMockFallback: false,
    markets: summaries,
    source: "contracts",
    summaryStatus: warnings.length > 0 || summaries.length < marketAddresses.length ? "partial" : "fresh",
    total: marketAddresses.length,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

function chooseStableSummary(
  latestResponse: MarketSummaryResponse,
  previousResponse: MarketSummaryResponse | undefined
) {
  if (!isRealSummaryResponse(latestResponse)) {
    return previousResponse
      ? markSummaryAsCached(previousResponse, ["Latest summary refresh returned no readable markets."])
      : latestResponse;
  }

  if (
    previousResponse &&
    isRealSummaryResponse(previousResponse) &&
    latestResponse.markets.length < previousResponse.markets.length
  ) {
    return markSummaryAsCached(previousResponse, [
      `Latest summary refresh loaded ${latestResponse.markets.length} of ${latestResponse.total} markets; serving the last better real summary.`
    ]);
  }

  return {
    ...latestResponse,
    summaryStatus: latestResponse.summaryStatus ?? "fresh"
  } satisfies MarketSummaryResponse;
}

function markSummaryAsCached(response: MarketSummaryResponse, warnings: string[] = []) {
  return {
    ...response,
    summaryStatus: "cached" as const,
    warnings: [...(response.warnings ?? []), ...warnings]
  };
}

function isRealSummaryResponse(response: MarketSummaryResponse | undefined) {
  return Boolean(
    response &&
      !response.isUsingMockFallback &&
      response.source === "contracts" &&
      response.markets.length > 0
  );
}

function getSummaryContracts(address: Address) {
  return summaryFunctionNames.map((functionName) => ({
    abi: contractAbis.predictionMarket,
    address,
    functionName
  }));
}

async function retryMarketSummaries({
  addresses,
  generatedAt,
  publicClient
}: {
  addresses: Address[];
  generatedAt: string;
  publicClient: PublicClient;
}) {
  const warnings: string[] = [];
  const summaries: MarketSummary[] = [];

  for (let index = 0; index < addresses.length; index += SUMMARY_READ_CONCURRENCY) {
    const chunk = addresses.slice(index, index + SUMMARY_READ_CONCURRENCY);
    const settledSummaries = await Promise.allSettled(
      chunk.map((address) => readMarketSummaryIndividually(publicClient, address, generatedAt))
    );

    settledSummaries.forEach((result, chunkIndex) => {
      if (result.status === "rejected" || !result.value) {
        warnings.push(`Could not read full summary for market ${chunk[chunkIndex]}.`);
        return;
      }

      summaries.push(result.value);
    });
  }

  return { summaries, warnings };
}

async function readMarketSummaryIndividually(
  publicClient: PublicClient,
  address: Address,
  generatedAt: string
) {
  const reads = await Promise.all(
    summaryFunctionNames.map(async (functionName) => {
      try {
        return {
          result: await publicClient.readContract({
            abi: contractAbis.predictionMarket,
            address,
            functionName
          }),
          status: "success" as const
        };
      } catch {
        return {
          status: "failure" as const
        };
      }
    })
  );

  return mapSummaryReads(address, reads, generatedAt);
}

function getSummaryMarketFactoryAddress() {
  const configuredAddress =
    process.env.MARKET_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ||
    contractAddresses.MarketFactory;

  return configuredAddress && isAddress(configuredAddress) ? getAddress(configuredAddress) : undefined;
}

function getSummaryRpcUrl() {
  return (
    process.env.ARC_TESTNET_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    ARC_TESTNET_RPC_URL
  );
}

function getSummaryChainId() {
  const rawValue = process.env.NEXT_PUBLIC_CHAIN_ID;
  const parsed = rawValue ? Number(rawValue) : ARC_TESTNET_CHAIN_ID;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : ARC_TESTNET_CHAIN_ID;
}

function mapSummaryReads(
  address: Address,
  reads: Array<{ result?: unknown; status: "success" | "failure" }>,
  updatedAt: string
): MarketSummary | null {
  try {
    const title = readResult<string>(reads[0]);
    const metadataURI = readResult<string>(reads[1]);
    const expirationTime = readResult<bigint>(reads[2]);
    const status = readResult<number>(reads[3]);
    const totalYesShares = readResult<bigint>(reads[4]);
    const totalNoShares = readResult<bigint>(reads[5]);
    const totalDeposited = readResult<bigint>(reads[6]);

    if (!title || expirationTime === undefined) {
      return null;
    }

    const expirationDate = toIsoDate(expirationTime);

    if (!expirationDate) {
      return null;
    }

    const parsedMetadata = parseMarketMetadata(metadataURI);
    const cleanTitle = sanitizeMarketTitle(title, parsedMetadata);
    const yesShares = safeNumber(totalYesShares);
    const noShares = safeNumber(totalNoShares);
    const totalShares = yesShares + noShares;
    const yesProbability = totalShares > 0 ? Math.round((yesShares / totalShares) * 100) : 50;
    const statusLabel = getMarketStatus(status, expirationTime);
    const volumeUsd = safeNumber(totalDeposited) / USDC_DECIMALS;

    return {
      address,
      category: parsedMetadata.category ?? inferCategory(cleanTitle, metadataURI),
      expiresAt: expirationDate,
      externalReference: parseExternalReferenceMetadata(metadataURI),
      liquidityUsd: statusLabel === "resolved" ? 0 : volumeUsd,
      noProbability: 100 - yesProbability,
      settlementTokenSymbol: deploymentConfig.isArcTestnet ? "USDC" : "Local USDC",
      sourceType: "contracts",
      status: statusLabel,
      title: cleanTitle,
      updatedAt,
      volumeUsd,
      yesProbability
    };
  } catch {
    return null;
  }
}

function getMockSummaryResponse(): MarketSummaryResponse {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    isUsingMockFallback: true,
    markets: mockMarkets.map((market) => ({
      address: market.id,
      category: market.category,
      expiresAt: market.expiresAt,
      externalReference: market.externalReference,
      liquidityUsd: market.liquidityUsd,
      noProbability: 100 - market.yesProbability,
      settlementTokenSymbol: market.settlementToken,
      sourceType: "mock",
      status: market.status,
      title: market.title,
      updatedAt: generatedAt,
      volumeUsd: market.volumeUsd,
      yesProbability: market.yesProbability
    })),
    source: "mock",
    summaryStatus: "fresh",
    total: mockMarkets.length
  };
}

function readResult<T>(value: { result?: unknown; status: "success" | "failure" } | undefined) {
  return value?.status === "success" ? value.result as T : undefined;
}

function safeNumber(value: bigint | undefined) {
  const parsed = Number(value ?? 0n);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toIsoDate(value: bigint) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getMarketStatus(status: number | undefined, expirationTime: bigint): MarketStatus {
  if (status === 1) {
    return "resolved";
  }

  if (Date.now() >= Number(expirationTime) * 1000) {
    return "expired";
  }

  return "active";
}

const categoriesByKeyword: Array<[MarketCategory, string[]]> = [
  ["Crypto", ["btc", "eth", "etf"]],
  ["Arc", ["arc", "stablecoin gas"]],
  ["Policy", ["bill", "committee", "congress"]],
  ["Earnings", ["earnings", "revenue", "guidance"]],
  ["Macro", ["fed", "ecb", "rates", "fomc"]]
];

function inferCategory(title: string, metadataURI: string | undefined): MarketCategory {
  const source = `${title} ${metadataURI ?? ""}`.toLowerCase();
  const match = categoriesByKeyword.find(([, keywords]) =>
    keywords.some((keyword) => source.includes(keyword))
  );

  return match?.[0] ?? "Macro";
}
