import Link from "next/link";
import { memo } from "react";
import { ArrowUpRight, Clock3, Droplets, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import { ProbabilityBar } from "@/features/markets/components/probability-bar";
import { formatExpiry, formatInteger, formatUsd } from "@/features/markets/lib/formatters";
import type { Market } from "@/features/markets/types";
import { cn } from "@/lib/utils";

function MarketCardComponent({ market }: { market: Market }) {
  const changeColor = market.change24h >= 0 ? "text-emerald-300" : "text-rose-300";
  const participantLabel =
    market.participants > 0 ? formatInteger(market.participants) : "Onchain activity";

  return (
    <Link className="group block min-w-0" href={`/markets/${market.id}`}>
      <Card className="h-full cursor-pointer border-white/[0.06] bg-slate-950/70 transition duration-200 hover:border-cyan-300/16 hover:bg-slate-900/60">
        <CardHeader className="gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{market.category}</Badge>
              <MarketStatusBadge status={market.status} />
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-cyan-300/80" />
          </div>
          <CardTitle className="text-[15px] leading-6 text-slate-200 transition group-hover:text-slate-50 sm:text-base">
            {market.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ProbabilityBar yesProbability={market.yesProbability} />

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Metric label="Volume" value={formatUsd(market.volumeUsd)} />
            <Metric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
          </div>

          <div className="mt-4 grid gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-slate-600" />
              {formatExpiry(market.expiresAt)}
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-slate-600" />
              {market.settlementToken}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-slate-600" />
              {participantLabel}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.014] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">24h signal</span>
              <span className={cn("font-medium", changeColor)}>
                {market.change24h >= 0 ? "+" : ""}
                {market.change24h.toFixed(1)}%
              </span>
            </div>
            <span className="shrink-0 font-medium text-slate-600 transition group-hover:text-cyan-200/80">
              Open Market -&gt;
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export const MarketCard = memo(MarketCardComponent);

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.014] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 truncate font-semibold text-slate-200">{value}</div>
    </div>
  );
}
