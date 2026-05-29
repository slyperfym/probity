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

function MarketCardComponent({
  duplicateLabel,
  market,
  variant = "grid"
}: {
  duplicateLabel?: string;
  market: Market;
  variant?: "grid" | "list";
}) {
  const changeColor = market.change24h >= 0 ? "text-emerald-700" : "text-rose-700";
  const participantLabel =
    market.participants > 0 ? formatInteger(market.participants) : "Onchain activity";

  return (
    <Link className="group block min-w-0" href={`/markets/${market.id}`}>
      <Card
        className={cn(
          "h-full cursor-pointer overflow-hidden border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.10)]",
          variant === "list" && "lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch"
        )}
      >
        <CardHeader className="gap-3.5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">{market.category}</Badge>
              <MarketStatusBadge outcome={market.outcome} status={market.status} />
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <CardTitle className="line-clamp-3 text-[15px] font-semibold leading-6 text-slate-950 transition group-hover:text-indigo-950 sm:text-base">
            {market.title}
          </CardTitle>
          {duplicateLabel && (
            <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
              Listed as {duplicateLabel}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <ProbabilityBar yesProbability={market.yesProbability} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Metric label="Volume" value={formatUsd(market.volumeUsd)} />
            <Metric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
          </div>

          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-3">
            {market.status === "expired" && (
              <div className="flex min-w-0 items-center gap-2 rounded-md bg-amber-50 px-2.5 py-2 text-amber-700 sm:col-span-3">
                Awaiting resolver settlement
              </div>
            )}
            <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2">
              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{formatExpiry(market.expiresAt)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2">
              <Droplets className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{market.settlementToken}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{participantLabel}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-[0_1px_0_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">24h signal</span>
              <span className={cn("font-medium", changeColor)}>
                {market.change24h >= 0 ? "+" : ""}
                {market.change24h.toFixed(1)}%
              </span>
            </div>
            <span className="shrink-0 font-semibold text-slate-500 transition group-hover:text-indigo-700">
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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 truncate font-semibold text-slate-950">{value}</div>
    </div>
  );
}
