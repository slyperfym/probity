import Link from "next/link";
import { ArrowUpRight, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { formatUsd } from "@/features/markets/lib/formatters";
import type { PortfolioPosition } from "@/features/portfolio/types";

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
      <CardHeader>
        <CardTitle>Open Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="hidden grid-cols-[1.7fr_0.55fr_0.7fr_0.7fr_0.7fr_0.55fr] gap-4 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 lg:grid">
            <span>Market</span>
            <span>Side</span>
            <span>Shares</span>
            <span>Avg</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/10">
            {positions.map((position) => (
              <div
                className="grid gap-3 p-4 text-sm lg:grid-cols-[1.7fr_0.55fr_0.7fr_0.7fr_0.7fr_0.55fr] lg:items-center lg:gap-4"
                key={position.id}
              >
                <Link
                  className="group flex items-start justify-between gap-3 font-medium text-white transition hover:text-cyan-200"
                  href={`/markets/${position.marketId}`}
                >
                  <span>{position.marketTitle}</span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
                </Link>
                <Badge variant={position.side === "YES" ? "yes" : "no"}>{position.side}</Badge>
                <Metric label="Shares" value={position.shares.toLocaleString("en-US")} />
                <Metric label="Avg" value={`${Math.round(position.averagePrice * 100)}%`} />
                <Metric label="Value" value={formatUsd(position.notionalUsd)} />
                <Badge variant={position.status === "claimable" ? "yes" : "muted"}>{position.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClaimableRewards({ positions }: { positions: PortfolioPosition[] }) {
  const claimablePositions = positions.filter((position) => position.claimableUsd > 0);

  if (claimablePositions.length === 0) {
    return (
      <StateCard
        description="Resolved winning positions will appear here with a claim action after contract integration."
        icon={Coins}
        title="No claimable rewards"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claimable Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {claimablePositions.map((position) => (
          <div
            className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4"
            key={position.id}
          >
            <div className="text-sm font-medium text-white">{position.marketTitle}</div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-emerald-200">Estimated reward</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {formatUsd(position.claimableUsd)}
                </div>
              </div>
              <Button disabled variant="secondary">
                Claim
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 lg:hidden">{label}</div>
      <div className="mt-1 text-slate-200 lg:mt-0">{value}</div>
    </div>
  );
}
