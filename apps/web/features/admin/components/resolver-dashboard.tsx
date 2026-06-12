"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Gavel, Loader2, ShieldCheck, XCircle } from "lucide-react";
import type { ActivityFeedItem } from "@probity/types";
import { getAddress } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import {
  deploymentConfig,
  getMarketFactoryConfig,
  getPredictionMarketConfig,
  hasContractAddress
} from "@/config/contracts";
import type { ResolverMarket } from "@/features/admin/types";
import { useLocalContractMarkets } from "@/features/contracts/hooks";
import { ActivityFeed } from "@/features/indexing";
import { mockIndexerAdapter } from "@/features/indexing/adapters/mock-indexer-adapter";
import type { Market } from "@/features/markets/types";
import { formatExpiry, formatUsd } from "@/features/markets/lib/formatters";
import { refreshOnchainQueries } from "@/lib/onchain-cache";

export function ResolverDashboard({ markets: mockMarkets }: { markets: ResolverMarket[] }) {
  const { address: accountAddress, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const connectedResolverAddress = accountAddress ? getAddress(accountAddress) : undefined;
  const shouldReadAccess =
    deploymentConfig.marketDataMode !== "mock" &&
    hasContractAddress("MarketFactory") &&
    Boolean(connectedResolverAddress);
  const approvedResolver = useReadContract({
    ...getMarketFactoryConfig(),
    args: connectedResolverAddress ? [connectedResolverAddress] : undefined,
    functionName: "approvedResolvers",
    query: {
      enabled: shouldReadAccess
    }
  });
  const localMarkets = useLocalContractMarkets();
  const resolveWrite = useWriteContract();
  const resolveReceipt = useWaitForTransactionReceipt({ hash: resolveWrite.data });
  const [pendingMarketId, setPendingMarketId] = React.useState<string | null>(null);
  const [isRefreshingOnchainData, setIsRefreshingOnchainData] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityFeedItem[]>([]);

  React.useEffect(() => {
    void mockIndexerAdapter.getActivityFeed().then(setActivity);
  }, []);

  React.useEffect(() => {
    if (resolveReceipt.isSuccess) {
      setIsRefreshingOnchainData(true);
      void refreshOnchainQueries(queryClient).finally(() => setIsRefreshingOnchainData(false));
    }
  }, [queryClient, resolveReceipt.isSuccess]);

  const isLocalMode = !localMarkets.isUsingMockFallback && localMarkets.markets.length > 0;
  const contractModeLabel = deploymentConfig.isArcTestnet ? "Arc testnet" : "Local contracts";
  const markets = isLocalMode ? localMarkets.markets.map(toResolverMarket) : mockMarkets;

  if (!isConnected || (shouldReadAccess && approvedResolver.isFetched && !approvedResolver.data)) {
    return (
      <AccessRequiredState
        description="Connect the configured resolver wallet to finalize outcomes."
        title="Resolver access required"
      />
    );
  }

  if (markets.length === 0) {
    return (
      <StateCard
        description="Expired markets awaiting resolver review will appear here."
        icon={Gavel}
        title="No resolver queue"
      />
    );
  }

  const awaiting = markets.filter((market) => market.status === "awaiting_resolution").length;
  const resolved = markets.filter((market) => market.status === "resolved").length;
  const review = markets.filter((market) => market.status === "cancel_review" || market.status === "active").length;
  const isResolving = resolveWrite.isPending || resolveReceipt.isLoading;

  function resolveMarket(market: ResolverMarket, outcome: "YES" | "NO") {
    if (!isLocalMode || !market.contractAddress) {
      return;
    }

    setPendingMarketId(`${market.id}:${outcome}`);
    resolveWrite.writeContract({
      ...getPredictionMarketConfig(market.contractAddress),
      args: [outcome === "YES" ? 1 : 2],
      functionName: "resolve"
    });
  }

  function cancelMarket(market: ResolverMarket) {
    if (!isLocalMode || !market.contractAddress) {
      return;
    }

    setPendingMarketId(`${market.id}:CANCEL`);
    resolveWrite.writeContract({
      ...getPredictionMarketConfig(market.contractAddress),
      functionName: "cancel"
    });
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        <AdminMetric label="Awaiting" value={String(awaiting)} />
        <AdminMetric label="Resolved" value={String(resolved)} />
        <AdminMetric label="Review" value={String(review)} />
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Resolver Queue</CardTitle>
            <Badge variant={isLocalMode ? "yes" : "info"}>
              {isLocalMode ? contractModeLabel : "Contracts unavailable"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="space-y-3">
            {markets.map((market) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={market.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{market.category}</Badge>
                      <ResolverStatusBadge status={market.status} />
                      {market.proposedOutcome && (
                        <Badge variant={market.proposedOutcome === "NO" ? "no" : "yes"}>
                          Resolved {market.proposedOutcome}
                        </Badge>
                      )}
                    </div>
                    <Link
                      className="group mt-3 inline-flex items-start gap-2 text-sm font-medium text-slate-950 transition hover:text-indigo-700"
                      href={`/markets/${market.marketId}`}
                    >
                      {market.title}
                      <ArrowUpRight className="mt-0.5 h-4 w-4 text-slate-400 transition group-hover:text-indigo-600" />
                    </Link>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                      <AdminInfo label="Expires" value={formatExpiry(market.expiry)} />
                      <AdminInfo label="Volume" value={formatUsd(market.volumeUsd)} />
                      <AdminInfo label="Required resolver" value={market.resolverAddress ? shortHash(market.resolverAddress) : market.resolver} />
                      <AdminInfo label="Connected wallet" value={connectedResolverAddress ? shortHash(connectedResolverAddress) : "Not connected"} />
                      <AdminInfo
                        label="Resolve action"
                        value={getResolveAvailabilityLabel({
                          accountAddress: connectedResolverAddress,
                          isConnected,
                          isLocalMode,
                          isResolving,
                          market
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
                    <Button
                      className="w-full"
                      disabled={!canResolve({ accountAddress, isConnected, isLocalMode, isResolving, market })}
                      onClick={() => resolveMarket(market, "YES")}
                      size="sm"
                      variant="secondary"
                    >
                      {isResolving && pendingMarketId === `${market.id}:YES` && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Resolve YES
                    </Button>
                    <Button
                      className="w-full"
                      disabled={!canResolve({ accountAddress, isConnected, isLocalMode, isResolving, market })}
                      onClick={() => resolveMarket(market, "NO")}
                      size="sm"
                      variant="secondary"
                    >
                      {isResolving && pendingMarketId === `${market.id}:NO` && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Resolve NO
                    </Button>
                    <Button
                      className="col-span-2 w-full lg:col-span-1"
                      disabled={!canCancel({ accountAddress, isConnected, isLocalMode, isResolving, market })}
                      onClick={() => cancelMarket(market)}
                      size="sm"
                      variant="outline"
                    >
                      {isResolving && pendingMarketId === `${market.id}:CANCEL` && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              Resolver-only
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {getResolverNotice({ accountAddress, isConnected, isLocalMode })}
            </p>
          </div>
          <ResolverTransactionState
            error={resolveWrite.error?.message}
            isPending={isResolving}
            isRefreshing={isRefreshingOnchainData}
            success={resolveReceipt.isSuccess}
            transactionHash={resolveWrite.data}
          />
        </CardContent>
      </Card>
      <ActivityFeed items={activity} />
    </div>
  );
}

function AccessRequiredState({ description, title }: { description: string; title: string }) {
  return (
    <Card className="border-dashed border-slate-300 bg-white shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="mt-4 text-base font-semibold text-slate-950">{title}</div>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        <Link
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          href="/markets"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>
      </CardContent>
    </Card>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function ResolverStatusBadge({ status }: { status: ResolverMarket["status"] }) {
  if (status === "active") {
    return <Badge variant="muted">Active</Badge>;
  }

  if (status === "awaiting_resolution") {
    return <Badge variant="info">Awaiting resolution</Badge>;
  }

  if (status === "resolved") {
    return <Badge variant="yes">Resolved</Badge>;
  }

  if (status === "cancelled") {
    return <Badge variant="muted">Cancelled</Badge>;
  }

  return <Badge variant="muted">Review</Badge>;
}

function AdminInfo({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <span className="mt-1 block truncate font-medium text-slate-700">{value}</span>
    </span>
  );
}

function toResolverMarket(market: Market): ResolverMarket {
  const isExpired = Date.now() >= new Date(market.expiresAt).getTime();

  return {
    category: market.category,
    contractAddress: market.id as `0x${string}`,
    expiry: market.expiresAt,
    id: market.id,
    marketId: market.id,
    proposedOutcome: market.outcome ? market.outcome.toUpperCase() as "YES" | "NO" : null,
    resolver: market.resolver,
    resolverAddress: market.resolverAddress,
    status:
      market.status === "resolved"
        ? "resolved"
        : market.status === "cancelled"
          ? "cancelled"
          : isExpired
            ? "awaiting_resolution"
            : "active",
    title: market.title,
    volumeUsd: market.volumeUsd
  };
}

function canResolve({
  accountAddress,
  isConnected,
  isLocalMode,
  isResolving,
  market
}: {
  accountAddress: `0x${string}` | undefined;
  isConnected: boolean;
  isLocalMode: boolean;
  isResolving: boolean;
  market: ResolverMarket;
}) {
  if (!isLocalMode || !isConnected || !accountAddress || isResolving) {
    return false;
  }

  if (market.status !== "awaiting_resolution" || !market.contractAddress || !market.resolverAddress) {
    return false;
  }

  return isResolverEligible({ accountAddress: getAddress(accountAddress), market });
}

function canCancel({
  accountAddress,
  isConnected,
  isLocalMode,
  isResolving,
  market
}: {
  accountAddress: `0x${string}` | undefined;
  isConnected: boolean;
  isLocalMode: boolean;
  isResolving: boolean;
  market: ResolverMarket;
}) {
  return canResolve({ accountAddress, isConnected, isLocalMode, isResolving, market });
}

function getResolveAvailabilityLabel({
  accountAddress,
  isConnected,
  isLocalMode,
  isResolving,
  market
}: {
  accountAddress: `0x${string}` | undefined;
  isConnected: boolean;
  isLocalMode: boolean;
  isResolving: boolean;
  market: ResolverMarket;
}) {
  if (!isLocalMode) {
    return "Contracts unavailable";
  }

  if (!isConnected || !accountAddress) {
    return "Connect resolver";
  }

  if (isResolving) {
    return "Resolving";
  }

  if (market.status === "active") {
    return "Active";
  }

  if (market.status === "resolved") {
    return "Resolved";
  }

  if (!isResolverEligible({ accountAddress, market })) {
    return "Resolver wallet required";
  }

  return "Available";
}

function isResolverEligible({
  accountAddress,
  market
}: {
  accountAddress: `0x${string}` | undefined;
  market: ResolverMarket;
}) {
  return Boolean(
    accountAddress &&
      market.resolverAddress &&
      getAddress(accountAddress) === getAddress(market.resolverAddress)
  );
}

function getResolverNotice({
  accountAddress,
  isConnected,
  isLocalMode
}: {
  accountAddress: `0x${string}` | undefined;
  isConnected: boolean;
  isLocalMode: boolean;
}) {
  if (!isLocalMode) {
    return "Contracts unavailable.";
  }

  if (!isConnected || !accountAddress) {
    return "Connect the required resolver wallet.";
  }

  return "Only the market resolver can finalize YES or NO.";
}

function ResolverTransactionState({
  error,
  isPending,
  isRefreshing,
  success,
  transactionHash
}: {
  error: string | undefined;
  isPending: boolean;
  isRefreshing: boolean;
  success: boolean;
  transactionHash: `0x${string}` | undefined;
}) {
  if (!error && !isPending && !isRefreshing && !success) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      {isPending && (
        <div className="flex items-center gap-2 text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Resolution pending{transactionHash ? ` (${shortHash(transactionHash)})` : ""}.
        </div>
      )}
      {success && !isPending && (
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Resolution confirmed.
        </div>
      )}
      {isRefreshing && !isPending && (
        <div className="mt-2 flex items-center gap-2 text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing resolver data.
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-rose-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error.length > 180 ? `${error.slice(0, 180)}...` : error}</span>
        </div>
      )}
    </div>
  );
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
