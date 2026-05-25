import { NextResponse } from "next/server";
import { createPublicClient, http, type Address } from "viem";

import { probityChain } from "@/config/chains";
import { contractAbis, contractAddresses, deploymentConfig } from "@/config/contracts";
import { parseExternalReferenceMetadata } from "@/features/discovery/lib/external-reference-matching";
import { mockMarkets } from "@/features/markets/data/mock-markets";
import { parseMarketMetadata, sanitizeMarketTitle } from "@/features/markets/lib/market-metadata";
import type { MarketSummary, MarketSummaryResponse } from "@/features/markets/types/market-summary";
import type { MarketCategory, MarketStatus } from "@/features/markets/types";

const USDC_DECIMALS = 1_000_000;
const ACTIVE_CACHE_MS = 30_000;

let cachedSummary:
  | {
      expiresAt: number;
      response: MarketSummaryResponse;
    }
  | undefined;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const shouldRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  if (!shouldRefresh && cachedSummary && cachedSummary.expiresAt > Date.now()) {
    return NextResponse.json(cachedSummary.response);
  }

  const response =
    deploymentConfig.marketDataMode === "mock" || !contractAddresses.MarketFactory
      ? getMockSummaryResponse()
      : await getContractSummaryResponse().catch(() => getMockSummaryResponse());

  cachedSummary = {
    expiresAt: Date.now() + ACTIVE_CACHE_MS,
    response
  };

  return NextResponse.json(response);
}

async function getContractSummaryResponse(): Promise<MarketSummaryResponse> {
  if (!contractAddresses.MarketFactory) {
    return getMockSummaryResponse();
  }

  const publicClient = createPublicClient({
    chain: probityChain,
    transport: http()
  });
  const marketAddresses = await publicClient.readContract({
    abi: contractAbis.marketFactory,
    address: contractAddresses.MarketFactory,
    functionName: "allMarkets"
  }) as Address[];
  const newestFirstAddresses = [...marketAddresses].reverse();
  const contracts = newestFirstAddresses.flatMap((address) => [
    { abi: contractAbis.predictionMarket, address, functionName: "title" },
    { abi: contractAbis.predictionMarket, address, functionName: "metadataURI" },
    { abi: contractAbis.predictionMarket, address, functionName: "expirationTime" },
    { abi: contractAbis.predictionMarket, address, functionName: "status" },
    { abi: contractAbis.predictionMarket, address, functionName: "resolvedOutcome" },
    { abi: contractAbis.predictionMarket, address, functionName: "totalYesShares" },
    { abi: contractAbis.predictionMarket, address, functionName: "totalNoShares" },
    { abi: contractAbis.predictionMarket, address, functionName: "totalDeposited" }
  ]);
  const reads = await publicClient.multicall({
    allowFailure: true,
    contracts
  });
  const generatedAt = new Date().toISOString();
  const summaries = newestFirstAddresses.flatMap((address, index) => {
    const offset = index * 8;
    const market = mapSummaryReads(address, reads.slice(offset, offset + 8), generatedAt);

    return market ? [market] : [];
  });

  return {
    generatedAt,
    isUsingMockFallback: false,
    markets: summaries,
    source: "contracts",
    total: marketAddresses.length
  };
}

function mapSummaryReads(
  address: Address,
  reads: Array<{ result?: unknown; status: "success" | "failure" }>,
  updatedAt: string
): MarketSummary | null {
  const title = readResult<string>(reads[0]);
  const metadataURI = readResult<string>(reads[1]);
  const expirationTime = readResult<bigint>(reads[2]);
  const status = readResult<number>(reads[3]);
  const totalYesShares = readResult<bigint>(reads[5]);
  const totalNoShares = readResult<bigint>(reads[6]);
  const totalDeposited = readResult<bigint>(reads[7]);

  if (!title || expirationTime === undefined) {
    return null;
  }

  const parsedMetadata = parseMarketMetadata(metadataURI);
  const cleanTitle = sanitizeMarketTitle(title, parsedMetadata);
  const yesShares = Number(totalYesShares ?? 0n);
  const noShares = Number(totalNoShares ?? 0n);
  const totalShares = yesShares + noShares;
  const yesProbability = totalShares > 0 ? Math.round((yesShares / totalShares) * 100) : 50;
  const statusLabel = getMarketStatus(status, expirationTime);
  const volumeUsd = Number(totalDeposited ?? 0n) / USDC_DECIMALS;

  return {
    address,
    category: parsedMetadata.category ?? inferCategory(cleanTitle, metadataURI),
    expiresAt: new Date(Number(expirationTime) * 1000).toISOString(),
    externalReference: parseExternalReferenceMetadata(metadataURI),
    liquidityUsd: statusLabel === "resolved" ? 0 : volumeUsd,
    noProbability: 100 - yesProbability,
    settlementTokenSymbol: deploymentConfig.isArcTestnet ? "USDC" : "MockUSDC",
    sourceType: "contracts",
    status: statusLabel,
    title: cleanTitle,
    updatedAt,
    volumeUsd,
    yesProbability
  };
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
    total: mockMarkets.length
  };
}

function readResult<T>(value: { result?: unknown; status: "success" | "failure" } | undefined) {
  return value?.status === "success" ? value.result as T : undefined;
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
