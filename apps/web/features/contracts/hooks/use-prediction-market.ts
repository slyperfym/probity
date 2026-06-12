"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import { getPredictionMarketConfig } from "@/config/contracts";
import { toOptionalAddress } from "@/lib/contracts";

export function usePredictionMarketTitle(marketAddress: string | undefined) {
  const address = toOptionalAddress(marketAddress);
  const config = getPredictionMarketConfig(address);

  return useReadContract({
    ...config,
    functionName: "title",
    query: {
      enabled: Boolean(address)
    }
  });
}

export function usePredictionMarketMetadataURI(marketAddress: string | undefined) {
  const address = toOptionalAddress(marketAddress);
  const config = getPredictionMarketConfig(address);

  return useReadContract({
    ...config,
    functionName: "metadataURI",
    query: {
      enabled: Boolean(address)
    }
  });
}

export function usePredictionMarketTotals(marketAddress: string | undefined) {
  const address = toOptionalAddress(marketAddress);
  const config = getPredictionMarketConfig(address);
  const enabled = Boolean(address);

  const yesShares = useReadContract({
    ...config,
    functionName: "totalYesShares",
    query: { enabled }
  });
  const noShares = useReadContract({
    ...config,
    functionName: "totalNoShares",
    query: { enabled }
  });
  const totalDeposited = useReadContract({
    ...config,
    functionName: "totalDeposited",
    query: { enabled }
  });

  return {
    isConfigured: enabled,
    noShares: noShares.data as bigint | undefined,
    noSharesQuery: noShares,
    totalDeposited: totalDeposited.data as bigint | undefined,
    totalDepositedQuery: totalDeposited,
    yesShares: yesShares.data as bigint | undefined,
    yesSharesQuery: yesShares
  };
}

export function usePredictionMarketLifecycle(marketAddress: string | undefined) {
  const address = toOptionalAddress(marketAddress);
  const config = getPredictionMarketConfig(address);
  const enabled = Boolean(address);

  const expirationTime = useReadContract({
    ...config,
    functionName: "expirationTime",
    query: { enabled }
  });
  const status = useReadContract({
    ...config,
    functionName: "status",
    query: { enabled }
  });
  const resolvedOutcome = useReadContract({
    ...config,
    functionName: "resolvedOutcome",
    query: { enabled }
  });
  const resolver = useReadContract({
    ...config,
    functionName: "resolver",
    query: { enabled }
  });

  return {
    expirationTime: expirationTime.data as bigint | undefined,
    expirationTimeQuery: expirationTime,
    isConfigured: enabled,
    resolvedOutcome: resolvedOutcome.data as number | undefined,
    resolvedOutcomeQuery: resolvedOutcome,
    resolver: resolver.data as Address | undefined,
    resolverQuery: resolver,
    status: status.data as number | undefined,
    statusQuery: status
  };
}

export function usePredictionMarketPosition({
  marketAddress,
  userAddress
}: {
  marketAddress: string | undefined;
  userAddress: string | undefined;
}) {
  const market = toOptionalAddress(marketAddress);
  const user = toOptionalAddress(userAddress);
  const config = getPredictionMarketConfig(market);
  const enabled = Boolean(market && user);

  return useReadContract({
    ...config,
    args: user ? [user] : undefined,
    functionName: "getPosition",
    query: {
      enabled,
      placeholderData: (previousData: unknown) => previousData,
      staleTime: 60_000,
      gcTime: 5 * 60_000
    }
  });
}
