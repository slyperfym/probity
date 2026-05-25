"use client";

import * as React from "react";
import { BriefcaseBusiness, Coins, History, Wallet } from "lucide-react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { contractAbis } from "@/config/contracts";
import { OnchainActivityList } from "@/features/activity/components/onchain-activity-list";
import { useWalletOnchainActivity } from "@/features/activity/hooks/use-onchain-activity";
import { useLocalContractMarkets } from "@/features/contracts/hooks";
import type { Market } from "@/features/markets/types";
import { formatUsd } from "@/features/markets/lib/formatters";
import { ActivityHistory } from "@/features/portfolio/components/activity-history";
import {
  ClaimableRewards,
  PortfolioPositions
} from "@/features/portfolio/components/portfolio-positions";
import {
  mockPortfolioActivity,
  mockPortfolioPositions
} from "@/features/portfolio/data/mock-portfolio";
import type { PortfolioPosition } from "@/features/portfolio/types";

const USDC_DECIMALS = 6;

export function PortfolioDashboard() {
  const { address: accountAddress, isConnected } = useAccount();
  const localMarkets = useLocalContractMarkets();
  const useMockFallback = localMarkets.isUsingMockFallback;
  const shouldReadPositions =
    !useMockFallback && Boolean(accountAddress) && localMarkets.markets.length > 0;
  const activityMarkets = React.useMemo(
    () =>
      localMarkets.markets.map((market) => ({
        address: market.id as `0x${string}`,
        title: market.title
      })),
    [localMarkets.markets]
  );
  const walletActivity = useWalletOnchainActivity({
    enabled: !useMockFallback && Boolean(accountAddress),
    markets: activityMarkets,
    walletAddress: accountAddress
  });

  const positionReads = useReadContracts({
    contracts: localMarkets.markets.map((market) => ({
      abi: contractAbis.predictionMarket,
      address: market.id as `0x${string}`,
      args: accountAddress ? [accountAddress] : undefined,
      functionName: "getPosition"
    })),
    query: {
      enabled: shouldReadPositions,
      placeholderData: (previousData) => previousData,
      refetchInterval: 12_000,
      refetchIntervalInBackground: false,
      retry: 1
    }
  });

  const livePositions = React.useMemo(() => {
    if (!shouldReadPositions || !positionReads.data) {
      return [];
    }

    return localMarkets.markets.flatMap((market, index) => {
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
  }, [localMarkets.markets, positionReads.data, shouldReadPositions]);

  const positions = useMockFallback ? mockPortfolioPositions : livePositions;
  const totalValue = positions.reduce((sum, position) => sum + position.notionalUsd, 0);
  const claimable = positions.reduce((sum, position) => sum + position.claimableUsd, 0);
  const activePositions = positions.filter((position) => position.status === "active").length;
  const isInitialLoading =
    (localMarkets.isLoading && localMarkets.markets.length === 0) ||
    (shouldReadPositions && positionReads.isLoading && !positionReads.data);
  const isRefreshing =
    Boolean(localMarkets.isRefreshing) ||
    Boolean((positionReads as { isFetching?: boolean }).isFetching && !positionReads.isLoading);
  const isError = !useMockFallback && positionReads.isError;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <PortfolioMetric icon={BriefcaseBusiness} label="Portfolio value" value={formatUsd(totalValue)} />
        <PortfolioMetric icon={Coins} label="Claimable" value={formatUsd(claimable)} />
        <PortfolioMetric icon={History} label="Active positions" value={String(activePositions)} />
      </div>

      {!useMockFallback && !isConnected ? (
        <StateCard
          description="Connect a wallet to read live YES/NO balances from deployed PredictionMarket contracts."
          icon={Wallet}
          title="Connect wallet to view live positions"
        />
      ) : isInitialLoading ? (
        <StateCard
          description="Reading deployed markets and wallet positions from the configured chain."
          kind="loading"
          title="Loading live portfolio"
        />
      ) : isError ? (
        <StateCard
          description="Position reads failed. The market board remains available, and mock fallback is preserved for demo mode."
          kind="error"
          title="Unable to load live positions"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <PortfolioPositions positions={positions} />
            {useMockFallback ? (
              <ActivityHistory activity={mockPortfolioActivity} />
            ) : (
              <OnchainActivityList
                emptyDescription="No onchain activity found for this wallet yet."
                isLoading={walletActivity.isLoading || walletActivity.isFetching}
                items={walletActivity.data ?? []}
                title="Recent Activity"
              />
            )}
          </div>
          <div className="space-y-6">
            {isRefreshing && (
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.035] px-3 py-2 text-xs text-cyan-100/80">
                Updating onchain portfolio data...
              </div>
            )}
            <ClaimableRewards enableClaims={!useMockFallback} positions={positions} />
            {useMockFallback ? (
              <>
                <StateCard
                  description="Mock fallback is active because deployed contracts are unavailable or disabled."
                  kind="loading"
                  title="Demo fallback mode"
                />
                <StateCard
                  description="Live wallet positions will replace mock data when deployed contract reads are available."
                  kind="error"
                  title="Live read placeholder"
                />
              </>
            ) : (
              <StateCard
                description="Live positions are read directly from each deployed PredictionMarket using getPosition(wallet)."
                title="Onchain portfolio"
              />
            )}
          </div>
        </div>
      )}
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
  market: Market;
  noShares: bigint;
  yesShares: bigint;
}): PortfolioPosition {
  const yes = Number(formatUnits(yesShares, USDC_DECIMALS));
  const no = Number(formatUnits(noShares, USDC_DECIMALS));
  const totalShares = yes + no;
  const winningShares =
    market.outcome === "yes" ? yes : market.outcome === "no" ? no : 0;
  const isClaimable = market.status === "resolved" && winningShares > 0 && !hasClaimed;
  const status = hasClaimed
    ? "claimed"
    : isClaimable
      ? "claimable"
      : market.status === "expired"
        ? "expired"
        : "active";
  const claimStatus = hasClaimed
    ? "Claimed"
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
    category: market.category,
    claimableUsd: isClaimable ? winningShares : 0,
    claimStatus,
    currentProbability: market.yesProbability / 100,
    expiresAt: market.expiresAt,
    id: `live-${market.id}`,
    marketId: market.id,
    marketStatus: market.status,
    marketTitle: market.title,
    noShares: no,
    notionalUsd: totalShares,
    settlementToken: market.settlementToken,
    shares: totalShares,
    side: yes >= no ? "YES" : "NO",
    status,
    yesShares: yes
  };
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
        <Icon className="h-4 w-4 text-cyan-300" />
        <CardTitle className="text-xs uppercase tracking-[0.16em] text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}
