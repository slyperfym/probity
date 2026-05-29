"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Droplets,
  ExternalLink,
  Landmark,
  ShieldCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Address } from "viem";
import { getAddress } from "viem";
import { useReadContracts } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contractAbis, deploymentConfig } from "@/config/contracts";
import { OnchainActivityList } from "@/features/activity/components/onchain-activity-list";
import { useMarketOnchainActivity } from "@/features/activity/hooks/use-onchain-activity";
import {
  mapPredictionMarketReadsToMarket,
  type MarketReadTuple
} from "@/features/contracts/hooks/use-local-contract-markets";
import { useMarketParticipantCount } from "@/features/contracts/hooks/use-market-participants";
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
      placeholderData: (previousData) => previousData,
      refetchInterval: 8_000,
      refetchIntervalInBackground: false,
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
  const participantCount = useMarketParticipantCount(address, Boolean(market));
  const marketActivity = useMarketOnchainActivity({
    enabled: Boolean(market),
    marketAddress: address,
    marketTitle: market?.title ?? "Prediction market"
  });
  const displayedMarket = market
    ? {
        ...market,
        participants: participantCount.data ?? 0
      }
    : null;

  if (contractReads.isLoading && !hasTimedOut) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] px-4 py-10 text-slate-700 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          Reading deployed PredictionMarket contract...
        </div>
      </main>
    );
  }

  if (contractReads.isError || hasTimedOut || !displayedMarket) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] px-4 py-10 text-slate-700 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-lg font-semibold text-slate-950">Onchain market unavailable</div>
          <p className="mt-2 text-sm text-slate-600">
            The configured chain is unavailable, the address is not a Probity market, or the
            market was redeployed. Return to markets to browse available Arc Testnet markets.
          </p>
          <Link className={cn(buttonVariants({ variant: "outline" }), "mt-5")} href="/markets">
            Back to markets
          </Link>
        </div>
      </main>
    );
  }

  const marketWithParticipants = displayedMarket;
  const noProbability = 100 - marketWithParticipants.yesProbability;
  const externalReference = marketWithParticipants.externalReference;

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="probity-grid border-b border-slate-200 bg-[#f7f7f2]">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-700"
            href="/markets"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>

          <div className="mt-4 max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{marketWithParticipants.category}</Badge>
              <MarketStatusBadge status={marketWithParticipants.status} />
              <Badge variant="info">
                {deploymentConfig.isArcTestnet ? "Arc Testnet" : "Local Contract"}
              </Badge>
            </div>
            <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              {marketWithParticipants.title}
            </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {marketWithParticipants.description}
            </p>
            {(contractReads as { isFetching?: boolean }).isFetching && !contractReads.isLoading && (
              <p className="mt-2 text-xs text-indigo-600">
                Updating onchain market data...
              </p>
            )}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <MetaChip icon={CalendarClock} label="Expiry" value={formatExpiry(marketWithParticipants.expiresAt)} />
              <MetaChip icon={Droplets} label="Token" value={marketWithParticipants.settlementToken} />
              {marketWithParticipants.participants > 0 && (
                <MetaChip icon={Users} label="Participants" value={formatInteger(marketWithParticipants.participants)} />
              )}
              <MetaChip icon={ShieldCheck} label="Resolver" value={shortValue(marketWithParticipants.resolver)} />
              <MetaChip icon={Landmark} label="Market" value={shortValue(address)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-6 lg:px-8">
        <div className="order-2 space-y-5 lg:order-1">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle>Onchain Signal</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
              <div className="grid grid-cols-2 gap-3">
                <OutcomeMetric label="YES" value={marketWithParticipants.yesProbability} variant="yes" />
                <OutcomeMetric label="NO" value={noProbability} variant="no" />
              </div>
              <ProbabilityBar className="mt-4" yesProbability={marketWithParticipants.yesProbability} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile icon={Landmark} label="Volume" value={formatUsd(marketWithParticipants.volumeUsd)} />
            <InfoTile icon={Droplets} label="Liquidity" value={formatUsd(marketWithParticipants.liquidityUsd)} />
            <InfoTile icon={CalendarClock} label="Expires" value={formatExpiry(marketWithParticipants.expiresAt)} />
            {marketWithParticipants.participants > 0 ? (
              <InfoTile icon={Users} label="Participants" value={formatInteger(marketWithParticipants.participants)} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Users className="h-4 w-4 text-indigo-600" />
                <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">Activity</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">Onchain activity</div>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Participant indexing is being improved.
                </p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle>Resolution Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
              <div className="space-y-2">
                {marketWithParticipants.rules.map((rule) => (
                  <div
                    className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={rule}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <p className="text-sm leading-6 text-slate-600">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {externalReference && (
            <Card>
              <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
                <CardTitle className="text-sm">External reference</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2 text-slate-500 sm:grid-cols-[140px_1fr]">
                    <span className="text-xs uppercase tracking-[0.14em] text-slate-600">Source</span>
                    <span className="text-slate-700">
                      {externalReference.externalSourceLabel || "External market metadata"}
                    </span>
                  </div>
                  {externalReference.externalQuestion && (
                    <div className="grid gap-2 text-slate-500 sm:grid-cols-[140px_1fr]">
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-600">
                        Original question
                      </span>
                      <span className="text-slate-600">{externalReference.externalQuestion}</span>
                    </div>
                  )}
                  {externalReference.externalSourceUrl && (
                    <Link
                      className="inline-flex items-center gap-2 text-xs font-medium text-indigo-700 transition hover:text-indigo-900"
                      href={externalReference.externalSourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View external source
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <p className="border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                    Reference metadata only. Probity market settles independently on Arc.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <OnchainActivityList
            emptyDescription="No activity found for this market yet."
            emptyTitle="No market activity"
            error={marketActivity.isError ? "Could not load onchain activity." : null}
            isLoading={marketActivity.isLoading || marketActivity.isFetching}
            items={marketActivity.data ?? []}
            loadingMessage="Reading market activity from Arc Testnet..."
            title="Market Activity"
          />
        </div>

        <aside className="order-1 space-y-4 lg:sticky lg:top-20 lg:order-2 lg:self-start">
          <TradingPanel market={marketWithParticipants} />
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
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-2 text-3xl font-semibold",
          variant === "yes" ? "text-emerald-700" : "text-rose-700"
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
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
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
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-700">{value}</span>
    </div>
  );
}

function shortValue(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}
