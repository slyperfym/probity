"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, DatabaseZap, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExternalMarketReference } from "@/features/discovery/types";
import { formatExpiry, formatUsd } from "@/features/markets/lib/formatters";
import { cn } from "@/lib/utils";

type DiscoveryResponse = {
  markets: ExternalMarketReference[];
  error?: string;
};

export function ExternalSignals() {
  const [markets, setMarkets] = React.useState<ExternalMarketReference[]>([]);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

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
    <section className="space-y-5">
      <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <DatabaseZap className="h-4 w-4" />
          External Signals
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          These references are public Polymarket Gamma market metadata for discovery only.
          Probity does not execute Polymarket trades, is not affiliated with Polymarket, and
          deploys separate Arc-native markets with independent settlement.
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
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {markets.map((market) => (
            <ExternalSignalCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExternalSignalCard({ market }: { market: ExternalMarketReference }) {
  const importHref = `/create?${new URLSearchParams({
    category: market.category,
    expiry: market.endDate ?? "",
    probability: market.probability === null ? "" : String(market.probability),
    question: market.question,
    source: "polymarket"
  }).toString()}`;

  return (
    <Card className="bg-slate-950/80">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="muted">External reference</Badge>
          <Badge>{market.category}</Badge>
        </div>
        <CardTitle className="leading-6">{market.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="YES" value={market.probability === null ? "N/A" : `${market.probability}%`} />
          <Metric label="Volume" value={formatUsd(market.volumeUsd)} />
          <Metric label="Liquidity" value={formatUsd(market.liquidityUsd)} />
          <Metric label="Ends" value={market.endDate ? formatExpiry(market.endDate) : "N/A"} />
        </div>
        <div className="mt-5 grid gap-2">
          <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={importHref}>
            Draft Probity Market
            <ArrowRight className="h-4 w-4" />
          </Link>
          {market.url && (
            <a
              className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
              href={market.url}
              rel="noreferrer"
              target="_blank"
            >
              View Source
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
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  );
}
