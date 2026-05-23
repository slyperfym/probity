"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import { deploymentConfig, getMarketFactoryConfig, hasContractAddress } from "@/config/contracts";
import { mockMarkets } from "@/features/markets/data/mock-markets";

const marketFactoryConfig = getMarketFactoryConfig();

export function useMarketFactoryDeployment() {
  const isConfigured = hasContractAddress("MarketFactory");

  return {
    address: isConfigured ? marketFactoryConfig.address : undefined,
    isConfigured
  };
}

export function useMarketFactoryMarketCount() {
  const isConfigured = hasContractAddress("MarketFactory");
  const shouldReadContracts = deploymentConfig.marketDataMode !== "mock" && isConfigured;

  return useReadContract({
    ...marketFactoryConfig,
    functionName: "marketCount",
    query: {
      enabled: shouldReadContracts,
      refetchInterval: 15_000,
      refetchIntervalInBackground: false
    }
  });
}

export function useMarketFactoryMarkets() {
  const isConfigured = hasContractAddress("MarketFactory");
  const shouldReadContracts = deploymentConfig.marketDataMode !== "mock" && isConfigured;
  const query = useReadContract({
    ...marketFactoryConfig,
    functionName: "allMarkets",
    query: {
      enabled: shouldReadContracts,
      placeholderData: (previousData: unknown) => previousData,
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
      retry: 1
    }
  });

  const shouldUseMockFallback =
    deploymentConfig.marketDataMode === "mock" || !isConfigured || query.isError;
  const fallbackReason =
    deploymentConfig.marketDataMode === "mock"
      ? "Mock mode is enabled by environment configuration."
      : !isConfigured
        ? "No MarketFactory address is configured."
        : query.isError
          ? "The configured chain is unavailable or returned an error."
          : "";

  return {
    ...query,
    contractMarkets: (query.data ?? []) as Address[],
    fallbackReason,
    isConfigured,
    isReadingContracts: shouldReadContracts && !query.isError,
    isUsingMockFallback: shouldUseMockFallback,
    marketDataMode: deploymentConfig.marketDataMode,
    mockMarkets: shouldUseMockFallback ? mockMarkets : []
  };
}
