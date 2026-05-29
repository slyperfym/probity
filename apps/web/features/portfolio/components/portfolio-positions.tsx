"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowUpRight, Coins, Loader2 } from "lucide-react";
import { isAddress, type Address } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { probityChain } from "@/config/chains";
import { getPredictionMarketConfig } from "@/config/contracts";
import { formatUsd } from "@/features/markets/lib/formatters";
import { formatExpiry } from "@/features/markets/lib/formatters";
import type { PortfolioPosition } from "@/features/portfolio/types";
import { refreshOnchainQueries } from "@/lib/onchain-cache";

export function PortfolioPositions({ positions }: { positions: PortfolioPosition[] }) {
  if (positions.length === 0) {
    return (
      <StateCard
        description="Positions will appear here after the connected wallet buys YES or NO shares."
        title="No portfolio positions"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>Open Positions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[1.7fr_0.65fr_0.65fr_0.75fr_0.75fr_0.55fr_0.6fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 lg:grid">
            <span>Market</span>
            <span>YES</span>
            <span>NO</span>
            <span>Claim</span>
            <span>Expiry</span>
            <span>Token</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-200">
            {positions.map((position) => (
              <div
                className="grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-[1.7fr_0.65fr_0.65fr_0.75fr_0.75fr_0.55fr_0.6fr] lg:items-center lg:gap-4"
                key={position.id}
              >
                <Link
                  className="group flex items-start justify-between gap-3 font-medium text-slate-950 transition hover:text-indigo-700 sm:col-span-2 lg:col-span-1"
                  href={`/markets/${position.marketId}`}
                >
                  <span>
                    {position.marketTitle}
                    <span className="mt-2 block text-xs font-normal text-indigo-600">
                      Manage position / sell
                    </span>
                  </span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-indigo-600" />
                </Link>
                <Metric label="YES" value={formatShares(position.yesShares ?? (position.side === "YES" ? position.shares : 0))} />
                <Metric label="NO" value={formatShares(position.noShares ?? (position.side === "NO" ? position.shares : 0))} />
                <Metric label="Claim" value={position.claimStatus ?? position.status} />
                <Metric label="Expiry" value={position.expiresAt ? formatExpiry(position.expiresAt) : "Unavailable"} />
                <Metric label="Token" value={position.settlementToken ?? "USDC"} />
                <Badge className="w-fit" variant={position.status === "claimable" ? "yes" : "muted"}>
                  {position.marketStatus ?? position.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatShares(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

export function ClaimableRewards({
  enableClaims = false,
  positions
}: {
  enableClaims?: boolean;
  positions: PortfolioPosition[];
}) {
  const queryClient = useQueryClient();
  const { chainId, isConnected } = useAccount();
  const claimWrite = useWriteContract();
  const claimReceipt = useWaitForTransactionReceipt({ hash: claimWrite.data });
  const [pendingMarketId, setPendingMarketId] = React.useState("");
  const [isRefreshingOnchainData, setIsRefreshingOnchainData] = React.useState(false);
  const isWrongChain = isConnected && chainId !== undefined && chainId !== probityChain.id;
  const isClaiming = claimWrite.isPending || claimReceipt.isLoading;
  const claimablePositions = positions.filter(
    (position) =>
      position.status === "claimable" &&
      position.canClaim !== false &&
      position.claimableUsd > 0 &&
      position.claimStatus === "Claimable"
  );

  React.useEffect(() => {
    if (claimReceipt.isSuccess) {
      setIsRefreshingOnchainData(true);
      void refreshOnchainQueries(queryClient).finally(() => {
        setIsRefreshingOnchainData(false);
        setPendingMarketId("");
      });
    }
  }, [claimReceipt.isSuccess, queryClient]);

  function claimPosition(position: PortfolioPosition) {
    if (!enableClaims || !isAddress(position.marketId)) {
      return;
    }

    setPendingMarketId(position.marketId);
    claimWrite.writeContract({
      ...getPredictionMarketConfig(position.marketId as Address),
      functionName: "claim"
    });
  }

  if (claimablePositions.length === 0) {
    return (
      <StateCard
        description="Winning positions will appear here after the resolver finalizes the winning outcome."
        icon={Coins}
        title="No claimable rewards"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>Claimable Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
        {claimablePositions.map((position) => (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            key={position.id}
          >
            <div className="text-sm font-medium text-slate-950">{position.marketTitle}</div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <div className="text-xs text-emerald-700">Estimated reward</div>
                <div className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                  {formatUsd(position.claimableUsd)}
                </div>
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={!enableClaims || !isConnected || isWrongChain || isClaiming}
                onClick={() => claimPosition(position)}
                variant="secondary"
              >
                {isClaiming && pendingMarketId === position.marketId && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isWrongChain ? "Wrong chain" : "Claim"}
              </Button>
            </div>
            {claimWrite.error && pendingMarketId === position.marketId && (
              <p className="mt-3 text-xs leading-5 text-rose-700">
                {claimWrite.error.message.length > 160
                  ? `${claimWrite.error.message.slice(0, 160)}...`
                  : claimWrite.error.message}
              </p>
            )}
            {claimReceipt.isSuccess && pendingMarketId === position.marketId && (
              <p className="mt-3 text-xs leading-5 text-emerald-700">
                Payout claimed on Arc Testnet. Refreshing portfolio data.
              </p>
            )}
          </div>
        ))}
        {isRefreshingOnchainData && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-700">
            Refreshing onchain claim status...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2.5 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="text-xs text-slate-500 lg:hidden">{label}</div>
      <div className="mt-1 break-words text-slate-700 lg:mt-0">{value}</div>
    </div>
  );
}
