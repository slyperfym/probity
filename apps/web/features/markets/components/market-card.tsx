import Link from "next/link";
import { ArrowUpRight, Clock3, Droplets, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import { ProbabilityBar } from "@/features/markets/components/probability-bar";
import { formatExpiry, formatInteger, formatUsd } from "@/features/markets/lib/formatters";
import type { Market } from "@/features/markets/types";
import { cn } from "@/lib/utils";

export function MarketCard({ market }: { market: Market }) {
  const changeColor = market.change24h >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <Link className="group block" href={`/markets/${market.id}`}>
      <Card className="h-full cursor-pointer transition duration-200 hover:border-cyan-300/35 hover:bg-slate-900/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <CardHeader className="gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{market.category}</Badge>
              <MarketStatusBadge status={market.status} />
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
          </div>
          <CardTitle className="text-base leading-6 text-slate-50 transition group-hover:text-white">
            {market.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <ProbabilityBar yesProbability={market.yesProbability} />

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Metric label="Volume" value={formatUsd(market.volumeUsd)} />
            <Metric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
          </div>

          <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-xs text-slate-500 sm:grid-cols-3">
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
              {formatInteger(market.participants)}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-xs">
            <span className="text-slate-500">24h signal</span>
            <span className={cn("font-medium", changeColor)}>
              {market.change24h >= 0 ? "+" : ""}
              {market.change24h.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 truncate font-semibold text-slate-100">{value}</div>
    </div>
  );
}
