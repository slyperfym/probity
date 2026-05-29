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
import {
  ClaimableRewards,
  PortfolioPositions
} from "@/features/portfolio/components/portfolio-positions";
import {
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
  const activityMarkets = React.useMemo(() => {
    const titleByAddress = new Map(
      localMarkets.markets.map((market) => [market.id.toLowerCase(), market.title])
    );

    return [...localMarkets.factoryMarkets.contractMarkets].reverse().map((address) => ({
      address: address as `0x${string}`,
      title: titleByAddress.get(address.toLowerCase()) ?? `PredictionMarket ${shortHash(address)}`
    }));
  }, [localMarkets.factoryMarkets.contractMarkets, localMarkets.markets]);
  const walletActivity = useWalletOnchainActivity({
    enabled: Boolean(accountAddress && activityMarkets.length > 0),
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
    <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:gap-6 lg:px-8 lg:py-6">
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-4">
        <PortfolioMetric icon={BriefcaseBusiness} label="Portfolio value" value={formatUsd(totalValue)} />
        <PortfolioMetric icon={Coins} label="Claimable" value={formatUsd(claimable)} />
        <PortfolioMetric icon={History} label="Active positions" value={String(activePositions)} />
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
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
    marketOutcome: market.outcome,
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
