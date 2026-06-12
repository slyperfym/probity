"use client";

import * as React from "react";
import { BriefcaseBusiness, Coins, History, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { contractAbis } from "@/config/contracts";
import { OnchainActivityList } from "@/features/activity/components/onchain-activity-list";
import { useWalletOnchainActivity } from "@/features/activity/hooks/use-onchain-activity";
import { formatUsd } from "@/features/markets/lib/formatters";
import {
  isCacheableSummaryResponse,
  readCachedMarketSummaries,
  writeCachedMarketSummaries,
  type CachedMarketSummaryEntry
} from "@/features/markets/lib/market-summary-cache";
import type { MarketSummary, MarketSummaryResponse } from "@/features/markets/types/market-summary";
import {
  ClaimableRewards,
  PortfolioPositions
} from "@/features/portfolio/components/portfolio-positions";
import {
  mockPortfolioPositions
} from "@/features/portfolio/data/mock-portfolio";
import type { PortfolioPosition } from "@/features/portfolio/types";

const USDC_DECIMALS = 6;
const ACTIVITY_MARKET_LIMIT = 12;
const PORTFOLIO_STALE_MS = 2 * 60_000;
const PORTFOLIO_GC_MS = 10 * 60_000;

export function PortfolioDashboard() {
  const { address: accountAddress, isConnected } = useAccount();
  const [cachedSummaryEntry, setCachedSummaryEntry] = React.useState<CachedMarketSummaryEntry | undefined>(() => readCachedMarketSummaries());
  const summaryQuery = useQuery({
    gcTime: PORTFOLIO_GC_MS,
    initialData: cachedSummaryEntry?.response,
    initialDataUpdatedAt: cachedSummaryEntry?.cachedAt,
    queryFn: fetchMarketSummaries,
    queryKey: ["probity", "market-summaries"],
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
    refetchOnReconnect: true,
    staleTime: PORTFOLIO_STALE_MS
  });
  React.useEffect(() => {
    if (isCacheableSummaryResponse(summaryQuery.data)) {
      const nextEntry = writeCachedMarketSummaries(summaryQuery.data);
      setCachedSummaryEntry(nextEntry);
    }
  }, [summaryQuery.data]);

  const summaryData = summaryQuery.data ?? cachedSummaryEntry?.response;
  const summaryMarkets = React.useMemo(
    () => summaryData?.markets ?? [],
    [summaryData?.markets]
  );
  const useMockFallback = Boolean(summaryData?.isUsingMockFallback || summaryQuery.isError);
  const shouldReadPositions =
    !useMockFallback && Boolean(accountAddress) && summaryMarkets.length > 0;
  const positionContracts = React.useMemo(
    () =>
      summaryMarkets.map((market) => ({
        abi: contractAbis.predictionMarket,
        address: market.address as `0x${string}`,
        args: accountAddress ? [accountAddress] : undefined,
        functionName: "getPosition"
      })),
    [accountAddress, summaryMarkets]
  );

  const positionReads = useReadContracts({
    contracts: positionContracts,
    query: {
      gcTime: PORTFOLIO_GC_MS,
      enabled: shouldReadPositions,
      placeholderData: (previousData) => previousData,
      retry: 1,
      staleTime: PORTFOLIO_STALE_MS
    }
  });

  const livePositions = React.useMemo(() => {
    if (!shouldReadPositions || !positionReads.data) {
      return [];
    }

    return summaryMarkets.flatMap((market, index) => {
      const result = positionReads.data[index];

      if (!result || result.status !== "success") {
        return [];
      }

      const [yesShares, noShares, hasClaimed] = result.result as readonly [bigint, bigint, boolean];

      if (yesShares === 0n && noShares === 0n) {
        return [];
      }

      return [
        mapLivePosition({
          hasClaimed,
          market,
          noShares,
          yesShares
        })
      ];
    });
  }, [positionReads.data, shouldReadPositions, summaryMarkets]);

  const positions = useMockFallback ? mockPortfolioPositions : livePositions;
  const portfolioMetrics = React.useMemo(
    () =>
      positions.reduce(
        (metrics, position) => ({
          activePositions: metrics.activePositions + (position.status === "active" ? 1 : 0),
          claimable: metrics.claimable + position.claimableUsd,
          totalValue: metrics.totalValue + position.notionalUsd
        }),
        {
          activePositions: 0,
          claimable: 0,
          totalValue: 0
        }
      ),
    [positions]
  );
  const activityMarkets = React.useMemo(
    () =>
      positions
        .filter((position) => isContractAddress(position.marketId))
        .slice(0, ACTIVITY_MARKET_LIMIT)
        .map((position) => ({
          address: position.marketId as `0x${string}`,
          title: position.marketTitle || `PredictionMarket ${shortHash(position.marketId)}`
        })),
    [positions]
  );
  const walletActivity = useWalletOnchainActivity({
    enabled: Boolean(accountAddress && activityMarkets.length > 0 && !useMockFallback),
    markets: activityMarkets,
    walletAddress: accountAddress
  });
  const isInitialLoading =
    (summaryQuery.isLoading && !summaryData) ||
    (shouldReadPositions && positionReads.isLoading && !positionReads.data);
  const isRefreshing =
    Boolean(summaryQuery.isFetching && !summaryQuery.isLoading) ||
    Boolean((positionReads as { isFetching?: boolean }).isFetching && !positionReads.isLoading);
  const isError = !useMockFallback && positionReads.isError;

  return (
    <section className="mx-auto grid w-full max-w-[1800px] gap-5 px-4 py-5 sm:px-6 lg:gap-6 lg:px-8 lg:py-6">
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-4">
        <PortfolioMetric icon={BriefcaseBusiness} label="Portfolio value" value={formatUsd(portfolioMetrics.totalValue)} />
        <PortfolioMetric icon={Coins} label="Claimable" value={formatUsd(portfolioMetrics.claimable)} />
        <PortfolioMetric icon={History} label="Active positions" value={String(portfolioMetrics.activePositions)} />
      </div>

      {!useMockFallback && !isConnected ? (
        <StateCard
          description="Connect to view positions and rewards."
          icon={Wallet}
          title="Wallet not connected"
        />
      ) : isInitialLoading ? (
        <StateCard
          description="Reading Arc Testnet positions."
          kind="loading"
          title="Loading portfolio"
        />
      ) : isError ? (
        <StateCard
          description="Refresh or try again shortly."
          kind="error"
          title="Could not load positions"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-6">
          <div className="space-y-6">
            <PortfolioPositions positions={positions} />
          </div>
          <div className="space-y-6">
            {isRefreshing && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                Updating portfolio...
              </div>
            )}
            <ClaimableRewards enableClaims={!useMockFallback} positions={positions} />
            {useMockFallback ? (
              <>
                <StateCard
                  description="Live contract reads are unavailable."
                  kind="loading"
                  title="Contract read fallback"
                />
                <StateCard
                  description="Live wallet positions unavailable."
                  kind="error"
                  title="Live read unavailable"
                />
              </>
            ) : (
              <StateCard
                description="Wallet positions from deployed markets."
                title="Onchain portfolio"
              />
            )}
          </div>
        </div>
      )}

      <OnchainActivityList
        emptyDescription="No onchain activity found for this wallet yet."
        emptyTitle="No activity yet"
        error={walletActivity.isError ? "Wallet positions and claimable rewards are still read from deployed markets." : null}
        errorTitle="Activity indexing is being improved."
        isLoading={walletActivity.isLoading || walletActivity.isFetching}
        items={walletActivity.data ?? []}
        loadingMessage="Reading wallet activity from Arc Testnet..."
        title="Recent Onchain Activity"
      />
    </section>
  );
}

function mapLivePosition({
  hasClaimed,
  market,
  noShares,
  yesShares
}: {
  hasClaimed: boolean;
  market: MarketSummary;
  noShares: bigint;
  yesShares: bigint;
}): PortfolioPosition {
  const yes = Number(formatUnits(yesShares, USDC_DECIMALS));
  const no = Number(formatUnits(noShares, USDC_DECIMALS));
  const totalShares = yes + no;
  const winningShares =
    market.outcome === "yes" ? yes : market.outcome === "no" ? no : 0;
  const isRefundable = market.status === "cancelled" && totalShares > 0;
  const isClaimable = market.status === "resolved" && winningShares > 0 && !hasClaimed;
  const status = hasClaimed
    ? "claimed"
    : isRefundable
      ? "refundable"
      : isClaimable
      ? "claimable"
      : market.status === "expired"
        ? "expired"
        : "active";
  const claimStatus = hasClaimed
    ? "Claimed"
    : isRefundable
      ? "Refund available"
      : isClaimable
      ? "Claimable"
      : market.status === "expired"
        ? "Awaiting resolver settlement"
        : market.status === "resolved"
          ? "No winning position to claim"
          : "Not claimable";

  return {
    averagePrice: 1,
    canClaim: isClaimable,
    canRefund: isRefundable,
    category: market.category,
    claimableUsd: isClaimable ? winningShares : isRefundable ? totalShares : 0,
    claimStatus,
    currentProbability: market.yesProbability / 100,
    expiresAt: market.expiresAt,
    id: `live-${market.address}`,
    marketId: market.address,
    marketOutcome: market.outcome,
    marketStatus: market.status,
    marketTitle: market.title,
    noShares: no,
    notionalUsd: totalShares,
    settlementToken: market.settlementTokenSymbol,
    shares: totalShares,
    side: yes >= no ? "YES" : "NO",
    status,
    yesShares: yes
  };
}

async function fetchMarketSummaries() {
  const response = await fetch("/api/markets/summary");
  const data = await response.json() as MarketSummaryResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Portfolio market metadata could not be loaded.");
  }

  return data;
}

function isContractAddress(value: string) {
  return value.startsWith("0x") && value.length === 42;
}

function PortfolioMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold text-slate-950 sm:text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
