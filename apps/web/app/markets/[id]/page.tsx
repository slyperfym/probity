import Link from "next/link";
import { notFound } from "next/navigation";
import { isAddress } from "viem";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Droplets,
  Landmark,
  ShieldCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractMarketDetail } from "@/features/markets/components/contract-market-detail";
import { CopyMarketLinkButton } from "@/features/markets/components/copy-market-link-button";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import { ProbabilityBar } from "@/features/markets/components/probability-bar";
import { getMarketById, mockMarkets } from "@/features/markets/data/mock-markets";
import {
  formatExpiry,
  formatInteger,
  formatUsd
} from "@/features/markets/lib/formatters";
import { TradingPanel } from "@/features/trading/components/trading-panel";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return mockMarkets.map((market) => ({ id: market.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = getMarketById(id);

  if (!market) {
    if (isAddress(id)) {
      return {
        title: "Onchain Market | Probity",
        description: "Read-only deployed PredictionMarket detail"
      };
    }

    return {
      title: "Market Not Found | Probity"
    };
  }

  return {
    title: `${market.title} | Probity`,
    description: market.description
  };
}

export default async function MarketDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const market = getMarketById(id);

  if (!market) {
    if (isAddress(id)) {
      return <ContractMarketDetail marketAddress={id} />;
    }

    notFound();
  }

  const noProbability = 100 - market.yesProbability;

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="probity-grid border-b border-slate-200 bg-[#f7f7f2]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-700"
            href="/markets"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>

          <div className="mt-5 max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{market.category}</Badge>
              <MarketStatusBadge outcome={market.outcome} status={market.status} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                {market.title}
              </h1>
              <CopyMarketLinkButton marketTitle={market.title} />
            </div>
            {market.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                {market.description}
              </p>
            )}
            {market.status === "expired" && (
              <p className="mt-3 w-fit rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Awaiting resolver settlement
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <MetaChip icon={CalendarClock} label="Expiry" value={formatExpiry(market.expiresAt)} />
              <MetaChip icon={Droplets} label="Token" value={market.settlementToken} />
              <MetaChip icon={Users} label="Participants" value={formatInteger(market.participants)} />
              <MetaChip icon={ShieldCheck} label="Resolver" value={market.resolver} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="space-y-5">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle>Market Signal</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
              <div className="grid grid-cols-2 gap-3">
                <OutcomeMetric label="YES" value={market.yesProbability} variant="yes" />
                <OutcomeMetric label="NO" value={noProbability} variant="no" />
              </div>
              <ProbabilityBar className="mt-4" yesProbability={market.yesProbability} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile icon={Landmark} label="Volume" value={formatUsd(market.volumeUsd)} />
            <InfoTile icon={Droplets} label="Liquidity" value={formatUsd(market.liquidityUsd)} />
            <InfoTile icon={CalendarClock} label="Expires" value={formatExpiry(market.expiresAt)} />
            <InfoTile icon={Users} label="Participants" value={formatInteger(market.participants)} />
          </div>

          <Card>
            <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm">Resolution Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
              <div className="grid gap-1.5">
                {[
                  "This market resolves through the configured resolver address.",
                  "Positions and settlement funds are read from the deployed PredictionMarket contract.",
                  "This is an Arc Testnet MVP market, not production oracle logic."
                ].map((rule) => (
                  <div className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2" key={rule}>
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                    <p className="text-xs leading-5 text-slate-600">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <TradingPanel market={market} />

          <Link
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            href="/markets"
          >
            Browse More Markets
          </Link>
        </aside>
      </section>
    </main>
  );
}

function OutcomeMetric({
  label,
  value,
  variant
}: {
  label: "YES" | "NO";
  value: number;
  variant: "yes" | "no";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cn("mt-2 text-3xl font-semibold", variant === "yes" ? "text-emerald-700" : "text-rose-700")}>
        {value}%
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Landmark;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-indigo-600" />
      <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
