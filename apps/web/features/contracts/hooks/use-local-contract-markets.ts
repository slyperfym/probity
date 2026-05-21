"use client";

import * as React from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";

import { contractAbis, deploymentConfig } from "@/config/contracts";
import { useMarketFactoryMarkets } from "@/features/contracts/hooks/use-market-factory";
import type { Market, MarketCategory, MarketOutcome, MarketStatus } from "@/features/markets/types";

const USDC_DECIMALS = 1_000_000;

const categoriesByKeyword: Array<[MarketCategory, string[]]> = [
  ["Crypto", ["btc", "eth", "etf"]],
  ["Arc", ["arc", "stablecoin gas"]],
  ["Policy", ["bill", "committee", "congress"]],
  ["Earnings", ["earnings", "revenue", "guidance"]],
  ["Macro", ["fed", "ecb", "rates", "fomc"]]
];

export type MarketReadTuple = [
  string | undefined,
  string | undefined,
  bigint | undefined,
  number | undefined,
  number | undefined,
  Address | undefined,
  bigint | undefined,
  bigint | undefined,
  bigint | undefined,
  Address | undefined
];

export function useLocalContractMarkets() {
  const factoryMarkets = useMarketFactoryMarkets();
  const marketAddresses = factoryMarkets.contractMarkets;
  const shouldReadMarkets =
    factoryMarkets.isReadingContracts &&
    !factoryMarkets.isUsingMockFallback &&
    marketAddresses.length > 0;

  const contracts = React.useMemo(
    () =>
      marketAddresses.flatMap((address) => [
        { abi: contractAbis.predictionMarket, address, functionName: "title" },
        { abi: contractAbis.predictionMarket, address, functionName: "metadataURI" },
        { abi: contractAbis.predictionMarket, address, functionName: "expirationTime" },
        { abi: contractAbis.predictionMarket, address, functionName: "status" },
        { abi: contractAbis.predictionMarket, address, functionName: "resolvedOutcome" },
        { abi: contractAbis.predictionMarket, address, functionName: "resolver" },
        { abi: contractAbis.predictionMarket, address, functionName: "totalYesShares" },
        { abi: contractAbis.predictionMarket, address, functionName: "totalNoShares" },
        { abi: contractAbis.predictionMarket, address, functionName: "totalDeposited" },
        { abi: contractAbis.predictionMarket, address, functionName: "settlementToken" }
      ]),
    [marketAddresses]
  );

  const marketReads = useReadContracts({
    contracts,
    query: {
      enabled: shouldReadMarkets,
      retry: 1
    }
  });

  const markets = React.useMemo(() => {
    if (!shouldReadMarkets || !marketReads.data) {
      return [];
    }

    return marketAddresses
      .map((address, index) => {
        const offset = index * 10;
        const readTuple = marketReads.data
          .slice(offset, offset + 10)
          .map((result) => (result.status === "success" ? result.result : undefined)) as MarketReadTuple;

        return mapPredictionMarketReadsToMarket(address, readTuple);
      })
      .filter((market): market is Market => Boolean(market));
  }, [marketAddresses, marketReads.data, shouldReadMarkets]);

  const shouldUseMockFallback =
    factoryMarkets.isUsingMockFallback || marketReads.isError || (shouldReadMarkets && markets.length === 0);

  return {
    ...marketReads,
    fallbackReason: marketReads.isError
      ? "Deployed market reads failed, so Probity is showing mock data."
      : factoryMarkets.fallbackReason,
    factoryMarkets,
    isLoading:
      factoryMarkets.isLoading ||
      (shouldReadMarkets && marketReads.isLoading),
    isUsingMockFallback: shouldUseMockFallback,
    markets,
    marketSource: shouldUseMockFallback ? "mock" : "contracts"
  };
}

export function mapPredictionMarketReadsToMarket(address: Address, reads: MarketReadTuple): Market | null {
  const [
    title,
    metadataURI,
    expirationTime,
    status,
    resolvedOutcome,
    resolver,
    totalYesShares,
    totalNoShares,
    totalDeposited,
    settlementTokenAddress
  ] = reads;

  if (!title || expirationTime === undefined) {
    return null;
  }

  const yesShares = Number(totalYesShares ?? 0n);
  const noShares = Number(totalNoShares ?? 0n);
  const deposited = Number(totalDeposited ?? 0n);
  const totalShares = yesShares + noShares;
  const expiresAt = new Date(Number(expirationTime) * 1000).toISOString();
  const marketStatus = getMarketStatus(status, expiresAt);
  const outcome = getOutcome(resolvedOutcome);
  const probability = totalShares > 0 ? Math.round((yesShares / totalShares) * 100) : 50;
  const volumeUsd = deposited / USDC_DECIMALS;

  return {
    category: inferCategory(title, metadataURI),
    change24h: 0,
    description: buildDescription(metadataURI),
    expiresAt,
    id: address,
    liquidityUsd: marketStatus === "resolved" ? 0 : volumeUsd,
    outcome,
    participants: 0,
    resolver: resolver ? `${resolver.slice(0, 6)}...${resolver.slice(-4)}` : "Configured resolver",
    resolverAddress: resolver,
    rules: [
      "This market resolves through the configured resolver address.",
      "YES/NO balances and settlement funds are read directly from the deployed PredictionMarket contract.",
      "Seeded markets are for testnet and local development only and do not execute production oracle logic."
    ],
    settlementToken: deploymentConfig.isArcTestnet ? "USDC" : "MockUSDC",
    settlementTokenAddress,
    status: marketStatus,
    title,
    volumeUsd,
    yesProbability: probability
  };
}

function getMarketStatus(status: number | undefined, expiresAt: string): MarketStatus {
  if (status === 1) {
    return "resolved";
  }

  if (Date.now() >= new Date(expiresAt).getTime()) {
    return "expired";
  }

  return "active";
}

function getOutcome(outcome: number | undefined): MarketOutcome {
  if (outcome === 1) {
    return "yes";
  }

  if (outcome === 2) {
    return "no";
  }

  return null;
}

function inferCategory(title: string, metadataURI: string | undefined): MarketCategory {
  const source = `${title} ${metadataURI ?? ""}`.toLowerCase();
  const match = categoriesByKeyword.find(([, keywords]) =>
    keywords.some((keyword) => source.includes(keyword))
  );

  return match?.[0] ?? "Macro";
}

function buildDescription(metadataURI: string | undefined) {
  if (!metadataURI) {
    return "Contract market seeded through the Probity Foundry workflow.";
  }

  return `Contract market seeded from ${metadataURI}.`;
}
