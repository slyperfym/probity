"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, DatabaseZap, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findProbityMarketForExternalSignal } from "@/features/discovery/lib/external-reference-matching";
import type { ExternalMarketReference } from "@/features/discovery/types";
import { formatExpiry, formatUsd } from "@/features/markets/lib/formatters";
import type { Market } from "@/features/markets/types";
import { cn } from "@/lib/utils";

type DiscoveryResponse = {
  markets: ExternalMarketReference[];
  error?: string;
};

type ListedExternalSignal = {
  market: ExternalMarketReference;
  probityMarketId?: string;
};

export function ExternalSignals({
  isUsingMockFallback,
  probityMarkets
}: {
  isUsingMockFallback: boolean;
  probityMarkets: Market[];
}) {
  const [markets, setMarkets] = React.useState<ExternalMarketReference[]>([]);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAlreadyListed, setShowAlreadyListed] = React.useState(false);

  const { alreadyListedSignals, draftableSignals } = React.useMemo(() => {
    return markets.reduce(
      (accumulator, market) => {
        const listedMarket = isUsingMockFallback
          ? undefined
          : findProbityMarketForExternalSignal(market, probityMarkets);

        if (listedMarket) {
          accumulator.alreadyListedSignals.push({
            market,
            probityMarketId: listedMarket.id
          });
          return accumulator;
        }

        accumulator.draftableSignals.push({ market });
        return accumulator;
      },
      {
        alreadyListedSignals: [] as ListedExternalSignal[],
        draftableSignals: [] as ListedExternalSignal[]
      }
    );
  }, [isUsingMockFallback, probityMarkets, markets]);

  React.useEffect(() => {
    let active = true;

    async function loadSignals() {
      try {
        const response = await fetch("/api/discovery/polymarket");
        const data = (await response.json()) as DiscoveryResponse;

        if (!active) return;

        if (!response.ok) {
          setError(data.error ?? "External market references are unavailable.");
          return;
        }

        setMarkets(data.markets);
      } catch {
        if (active) {
          setError("External market references are unavailable.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSignals();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="rounded-lg border border-cyan-400/14 bg-cyan-400/[0.035] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <DatabaseZap className="h-4 w-4" />
          External Signals
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          These references are public Polymarket Gamma market metadata for discovery only.
          Probity does not execute Polymarket trades, is not affiliated with Polymarket, and
          deploys separate Arc-native markets with independent USDC settlement.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-8 text-sm text-slate-400">
          Loading external market references...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/70 p-8 text-sm text-slate-400">
          {error}
        </div>
      ) : (
        <>
          {draftableSignals.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {draftableSignals.map(({ market }) => (
                <ExternalSignalCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/70 p-8 text-sm text-slate-400">
              No new external references are available to draft right now.
            </div>
          )}

          {alreadyListedSignals.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-slate-950/70">
              <button
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                onClick={() => setShowAlreadyListed((current) => !current)}
                type="button"
              >
                <span className="text-sm font-medium text-slate-200">
                  Already listed references ({alreadyListedSignals.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-500 transition",
                    showAlreadyListed && "rotate-180 text-cyan-300"
                  )}
                />
              </button>
              {showAlreadyListed && (
                <div className="grid gap-3 border-t border-white/10 p-4 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {alreadyListedSignals.map(({ market, probityMarketId }) => (
                    <ExternalSignalCard
                      key={market.id}
                      listedMarketId={probityMarketId}
                      market={market}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ExternalSignalCard({
  listedMarketId,
  market
}: {
  listedMarketId?: string;
  market: ExternalMarketReference;
}) {
  const importHref = `/create?${new URLSearchParams({
    category: market.category,
    externalId: market.id,
    expiry: market.endDate ?? "",
    probability: market.probability === null ? "" : String(market.probability),
    question: market.question,
    source: "polymarket",
    sourceLabel: market.source,
    sourceUrl: market.url ?? ""
  }).toString()}`;

  return (
    <Card className="bg-slate-950/80">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={listedMarketId ? "yes" : "muted"}>
            {listedMarketId ? "Already listed on Probity" : "External reference"}
          </Badge>
          <Badge>{market.category}</Badge>
        </div>
        <CardTitle className="text-[15px] leading-6 sm:text-sm">{market.question}</CardTitle>
        <p className="text-xs leading-5 text-slate-500">
          {listedMarketId
            ? "This external reference already maps to a Probity Arc Testnet market."
            : "Use this reference to draft a separate Arc-native Probity market."}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="YES" value={market.probability === null ? "N/A" : `${market.probability}%`} />
          <Metric label="Volume" value={formatUsd(market.volumeUsd)} />
          <Metric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
          <Metric label="Ends" value={market.endDate ? formatExpiry(market.endDate) : "N/A"} />
        </div>
        <div className="mt-5 grid gap-2">
          {listedMarketId ? (
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              href={`/markets/${listedMarketId}`}
            >
              Open Probity Market
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link className={cn(buttonVariants({ variant: "default" }), "w-full")} href={importHref}>
              Draft Probity Market
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {market.url && (
            <a
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-slate-400")}
              href={market.url}
              rel="noreferrer"
              target="_blank"
            >
              View External Source
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  );
}
