"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Gavel, Loader2, ShieldCheck, XCircle } from "lucide-react";
import type { ActivityFeedItem } from "@probity/types";
import { getAddress } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { deploymentConfig, getPredictionMarketConfig } from "@/config/contracts";
import type { ResolverMarket } from "@/features/admin/types";
import { useLocalContractMarkets } from "@/features/contracts/hooks";
import { ActivityFeed } from "@/features/indexing";
import { mockIndexerAdapter } from "@/features/indexing/adapters/mock-indexer-adapter";
import type { Market } from "@/features/markets/types";
import { formatExpiry, formatUsd } from "@/features/markets/lib/formatters";

export function ResolverDashboard({ markets: mockMarkets }: { markets: ResolverMarket[] }) {
  const { address: accountAddress, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const localMarkets = useLocalContractMarkets();
  const resolveWrite = useWriteContract();
  const resolveReceipt = useWaitForTransactionReceipt({ hash: resolveWrite.data });
  const [pendingMarketId, setPendingMarketId] = React.useState<string | null>(null);
  const [activity, setActivity] = React.useState<ActivityFeedItem[]>([]);

  React.useEffect(() => {
    void mockIndexerAdapter.getActivityFeed().then(setActivity);
  }, []);

  React.useEffect(() => {
    if (resolveReceipt.isSuccess) {
      void queryClient.invalidateQueries();
    }
  }, [queryClient, resolveReceipt.isSuccess]);

  const isLocalMode = !localMarkets.isUsingMockFallback && localMarkets.markets.length > 0;
  const contractModeLabel = deploymentConfig.isArcTestnet ? "Arc testnet" : "Local contracts";
  const markets = isLocalMode ? localMarkets.markets.map(toResolverMarket) : mockMarkets;
  const connectedResolverAddress = accountAddress ? getAddress(accountAddress) : undefined;

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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <AdminMetric label="Awaiting" value={String(awaiting)} />
        <AdminMetric label="Resolved" value={String(resolved)} />
        <AdminMetric label="Review" value={String(review)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Resolver Queue</CardTitle>
            <Badge variant={isLocalMode ? "yes" : "info"}>
              {isLocalMode ? contractModeLabel : "Mock fallback"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {markets.map((market) => (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={market.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{market.category}</Badge>
                      <ResolverStatusBadge status={market.status} />
                      {market.proposedOutcome && <Badge variant="info">{market.proposedOutcome}</Badge>}
                    </div>
                    <Link
                      className="group mt-3 inline-flex items-start gap-2 text-sm font-medium text-white transition hover:text-cyan-200"
                      href={`/markets/${market.marketId}`}
                    >
                      {market.title}
                      <ArrowUpRight className="mt-0.5 h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
                    </Link>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                      <span>Expires {formatExpiry(market.expiry)}</span>
                      <span>Volume {formatUsd(market.volumeUsd)}</span>
                      <span>Resolver {market.resolver}</span>
                      <span>
                        {isResolverEligible({ accountAddress: connectedResolverAddress, market })
                          ? "Eligible resolver"
                          : "Resolver wallet required"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
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
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              Resolver guardrails
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {getResolverNotice({ accountAddress, isConnected, isLocalMode })}
            </p>
          </div>
          <ResolverTransactionState
            error={resolveWrite.error?.message}
            isPending={isResolving}
            success={resolveReceipt.isSuccess}
            transactionHash={resolveWrite.data}
          />
        </CardContent>
      </Card>
      <ActivityFeed items={activity} />
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
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

  return <Badge variant="muted">Review</Badge>;
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
    status: market.status === "resolved" ? "resolved" : isExpired ? "awaiting_resolution" : "active",
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
    return "Mock fallback is active, so resolver transactions are disabled until deployed contracts are reachable.";
  }

  if (!isConnected || !accountAddress) {
    return "Connect the resolver wallet for this market before resolving expired markets.";
  }

  return "Only the resolver address stored on each deployed PredictionMarket can resolve YES or NO after expiration.";
}

function ResolverTransactionState({
  error,
  isPending,
  success,
  transactionHash
}: {
  error: string | undefined;
  isPending: boolean;
  success: boolean;
  transactionHash: `0x${string}` | undefined;
}) {
  if (!error && !isPending && !success) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
      {isPending && (
        <div className="flex items-center gap-2 text-cyan-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Resolution transaction pending{transactionHash ? ` (${shortHash(transactionHash)})` : ""}.
        </div>
      )}
      {success && !isPending && (
        <div className="flex items-center gap-2 text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Resolution confirmed. Winning positions are now claimable.
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-rose-200">
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
