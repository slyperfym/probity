"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Droplets, Landmark, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Address } from "viem";
import { getAddress } from "viem";
import { useReadContracts } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contractAbis, deploymentConfig } from "@/config/contracts";
import {
  mapPredictionMarketReadsToMarket,
  type MarketReadTuple
} from "@/features/contracts/hooks/use-local-contract-markets";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import { ProbabilityBar } from "@/features/markets/components/probability-bar";
import { formatExpiry, formatInteger, formatUsd } from "@/features/markets/lib/formatters";
import { TradingPanel } from "@/features/trading/components/trading-panel";
import { cn } from "@/lib/utils";

export function ContractMarketDetail({ marketAddress }: { marketAddress: string }) {
  const address = getAddress(marketAddress);
  const [hasTimedOut, setHasTimedOut] = React.useState(false);
  const contractReads = useReadContracts({
    contracts: [
      { abi: contractAbis.predictionMarket, address, functionName: "title" },
      { abi: contractAbis.predictionMarket, address, functionName: "metadataURI" },
      { abi: contractAbis.predictionMarket, address, functionName: "expirationTime" },
      { abi: contractAbis.predictionMarket, address, functionName: "status" },
      { abi: contractAbis.predictionMarket, address, functionName: "resolvedOutcome" },
      { abi: contractAbis.predictionMarket, address, functionName: "resolver" },
      { abi: contractAbis.predictionMarket, address, functionName: "totalYesShares" },
      { abi: contractAbis.predictionMarket, address, functionName: "totalNoShares" },
      { abi: contractAbis.predictionMarket, address, functionName: "totalDeposited" },
      { abi: contractAbis.predictionMarket, address, functionName: "settlementToken" }
    ],
    query: {
      retry: 1
    }
  });

  React.useEffect(() => {
    if (!contractReads.isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => setHasTimedOut(true), 3500);

    return () => window.clearTimeout(timeout);
  }, [contractReads.isLoading]);

  const market = contractReads.data
    ? mapPredictionMarketReadsToMarket(
        address,
        contractReads.data.map((result) =>
          result.status === "success" ? result.result : undefined
        ) as MarketReadTuple
      )
    : null;

  if (contractReads.isLoading && !hasTimedOut) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-lg border border-white/10 bg-white/[0.03] p-8">
          Reading deployed PredictionMarket contract...
        </div>
      </main>
    );
  }

  if (contractReads.isError || hasTimedOut || !market) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-lg border border-white/10 bg-white/[0.03] p-8">
          <div className="text-lg font-semibold text-white">Onchain market unavailable</div>
          <p className="mt-2 text-sm text-slate-400">
            The configured chain is unavailable, the address is not a Probity market, or the
            market was redeployed. Return to markets to use the mock fallback.
          </p>
          <Link className={cn(buttonVariants({ variant: "outline" }), "mt-5")} href="/markets">
            Back to markets
          </Link>
        </div>
      </main>
    );
  }

  const noProbability = 100 - market.yesProbability;

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-200"
            href="/markets"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>

          <div className="mt-5 max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{market.category}</Badge>
              <MarketStatusBadge status={market.status} />
              <Badge className="border-cyan-300/20 bg-cyan-400/[0.06] text-cyan-100/85" variant="info">
                {deploymentConfig.isArcTestnet ? "Arc Testnet" : "Local Contract"}
              </Badge>
            </div>
            <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-slate-100 sm:text-4xl">
              {market.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              {market.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <MetaChip icon={CalendarClock} label="Expiry" value={formatExpiry(market.expiresAt)} />
              <MetaChip icon={Droplets} label="Token" value={market.settlementToken} />
              <MetaChip icon={Users} label="Participants" value={formatInteger(market.participants)} />
              <MetaChip icon={ShieldCheck} label="Resolver" value={shortValue(market.resolver)} />
              <MetaChip icon={Landmark} label="Market" value={shortValue(address)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="space-y-5">
          <Card className="bg-slate-950/75">
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle className="text-slate-100">Onchain Signal</CardTitle>
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

          <Card className="bg-slate-950/75">
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle>Resolution Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
              <div className="space-y-2">
                {market.rules.map((rule) => (
                  <div
                    className="flex gap-3 rounded-md border border-white/[0.07] bg-white/[0.018] p-3"
                    key={rule}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" />
                    <p className="text-sm leading-6 text-slate-400">{rule}</p>
                  </div>
                ))}
                <div className="flex gap-3 rounded-md border border-white/[0.07] bg-white/[0.018] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" />
                  <p className="text-sm leading-6 text-slate-400">
                    Balances and settlement funds are read from this deployed PredictionMarket contract.
                  </p>
                </div>
                <div className="flex gap-3 rounded-md border border-white/[0.07] bg-white/[0.018] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" />
                  <p className="text-sm leading-6 text-slate-400">
                    Seeded markets are Arc testnet/demo only and are resolved by the configured resolver address.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <TradingPanel market={market} />
          <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href="/markets">
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
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.018] p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-2 text-3xl font-semibold",
          variant === "yes" ? "text-emerald-300/85" : "text-rose-300/85"
        )}
      >
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
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.018] p-4">
      <Icon className="h-4 w-4 text-cyan-300/70" />
      <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-200">{value}</div>
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
    <div className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.018] px-3 py-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-slate-600" />
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-400">{value}</span>
    </div>
  );
}

function shortValue(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}
