import Link from "next/link";
import { memo } from "react";
import { ArrowUpRight, Clock3, Droplets, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const participantLabel =
    market.participants > 0 ? formatInteger(market.participants) : "Onchain activity";
  const noProbability = 100 - market.yesProbability;

  if (variant === "list") {
    return (
      <Link className="group block min-w-0" href={`/markets/${market.id}`}>
        <article className="grid gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-indigo-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)] sm:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_360px] lg:items-center">
          <MarketThumbnail market={market} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">{market.category}</Badge>
              <MarketStatusBadge outcome={market.outcome} status={market.status} />
              {duplicateLabel && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {duplicateLabel}
                </span>
              )}
            </div>
            <div className="mt-1.5 line-clamp-3 text-sm font-semibold leading-5 text-slate-950 transition group-hover:text-indigo-950 sm:line-clamp-2">
              {market.title}
            </div>
            <div className="mt-2 max-w-sm">
              <ProbabilityBar className="!space-y-1.5" yesProbability={market.yesProbability} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs lg:text-right">
            <ListMetric label="Volume" value={formatUsd(market.volumeUsd)} />
            <ListMetric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
            <ListMetric label="Ends" value={formatExpiry(market.expiresAt)} />
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link className="group block min-w-0" href={`/markets/${market.id}`}>
      <article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_36px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
        <div className="relative">
          <MarketThumbnail market={market} />
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <Badge className="border-white/70 bg-white/90 text-slate-700 shadow-sm">{market.category}</Badge>
            <MarketStatusBadge outcome={market.outcome} status={market.status} />
          </div>
        </div>

        <div className="space-y-3.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-slate-950 transition group-hover:text-indigo-950 sm:text-base">
                {market.title}
              </h3>
              {duplicateLabel && (
                <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  Listed as {duplicateLabel}
                </span>
              )}
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          <ProbabilityBar className="!space-y-1.5" yesProbability={market.yesProbability} />

          <div className="grid grid-cols-2 gap-2">
            <OutcomeBlock label="YES" value={market.yesProbability} variant="yes" />
            <OutcomeBlock label="NO" value={noProbability} variant="no" />
          </div>

          <div className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-3">
            <MetaItem icon={Droplets} label={formatUsd(market.volumeUsd)} />
            <MetaItem icon={Users} label={formatUsd(market.liquidityUsd)} />
            <MetaItem icon={Clock3} label={formatExpiry(market.expiresAt)} />
            {market.status === "expired" && (
              <div className="rounded-md bg-amber-50 px-2.5 py-2 text-amber-700 sm:col-span-3">
                Awaiting resolver settlement
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition group-hover:border-indigo-200 group-hover:text-indigo-700">
            <span>Open Market</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export const MarketCard = memo(MarketCardComponent);

function MarketThumbnail({ market, size = "lg" }: { market: Market; size?: "lg" | "sm" }) {
  const palette = getThumbnailPalette(market.category);

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-slate-200 bg-slate-100",
        size === "lg" ? "aspect-[16/9] rounded-t-2xl" : "aspect-[4/3] rounded-lg sm:aspect-auto sm:h-full sm:min-h-20"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", palette.background)} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/20 to-transparent" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.75)_0,transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.30)_1px,transparent_1px)] [background-size:100%_100%,18px_18px]" />
      <div className="absolute bottom-3 left-3 flex items-end gap-1.5">
        <span className={cn("h-5 w-2 rounded-full", palette.primary)} />
        <span className={cn("h-9 w-2 rounded-full", palette.secondary)} />
        <span className="h-6 w-2 rounded-full bg-white/80" />
      </div>
      <div className="absolute right-3 top-3 rounded-full border border-white/50 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur">
        {market.settlementToken}
      </div>
    </div>
  );
}

function OutcomeBlock({
  label,
  value,
  variant
}: {
  label: "YES" | "NO";
  value: number;
  variant: "yes" | "no";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        variant === "yes"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}%</div>
    </div>
  );
}

function MetaItem({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function ListMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 lg:border-0 lg:bg-transparent lg:px-0">
      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function getThumbnailPalette(category: Market["category"]) {
  switch (category) {
    case "Crypto":
      return {
        background: "from-blue-100 via-indigo-100 to-slate-50",
        primary: "bg-blue-500",
        secondary: "bg-indigo-500"
      };
    case "Policy":
      return {
        background: "from-amber-100 via-orange-100 to-slate-50",
        primary: "bg-amber-500",
        secondary: "bg-orange-500"
      };
    case "Arc":
      return {
        background: "from-emerald-100 via-teal-100 to-slate-50",
        primary: "bg-emerald-500",
        secondary: "bg-teal-500"
      };
    case "Earnings":
      return {
        background: "from-violet-100 via-fuchsia-100 to-slate-50",
        primary: "bg-violet-500",
        secondary: "bg-fuchsia-500"
      };
    case "Macro":
    default:
      return {
        background: "from-slate-100 via-indigo-100 to-white",
        primary: "bg-slate-800",
        secondary: "bg-indigo-500"
      };
  }
}
