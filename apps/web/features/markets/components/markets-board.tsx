"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deploymentConfig } from "@/config/contracts";
import { useLocalContractMarkets } from "@/features/contracts/hooks";
import { ExternalSignals } from "@/features/discovery/components/external-signals";
import { MarketCard } from "@/features/markets/components/market-card";
import {
  mockMarkets,
  marketCategories,
  marketStatuses
} from "@/features/markets/data/mock-markets";
import { formatUsd } from "@/features/markets/lib/formatters";
import type { Market, MarketCategory, MarketStatus } from "@/features/markets/types";
import { cn } from "@/lib/utils";

type CategoryFilter = (typeof marketCategories)[number];
type StatusFilter = (typeof marketStatuses)[number];

export function MarketsBoard() {
  const [category, setCategory] = React.useState<CategoryFilter>("All");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const localMarkets = useLocalContractMarkets();
  const displayedMarkets = localMarkets.isUsingMockFallback ? mockMarkets : localMarkets.markets;

  const filteredMarkets = getMarketsByFilter(displayedMarkets,
    category as "All" | MarketCategory,
    status as "All" | MarketStatus
  );
  const activeMarkets = filteredMarkets.filter((market) => market.status === "active").length;
  const totalVolume = filteredMarkets.reduce((sum, market) => sum + market.volumeUsd, 0);
  const totalLiquidity = filteredMarkets.reduce((sum, market) => sum + market.liquidityUsd, 0);
  const contractSourceLabel = deploymentConfig.isArcTestnet ? "Arc testnet" : "Local contracts";
  const dataSourceLabel = localMarkets.isUsingMockFallback ? "Mock dataset" : contractSourceLabel;
  const dataSourceTone = localMarkets.isUsingMockFallback ? "text-amber-200" : "text-emerald-200";
  const hasConnectedFactoryWithoutMarkets =
    !localMarkets.isLoading &&
    !localMarkets.isUsingMockFallback &&
    localMarkets.factoryMarkets.isConfigured &&
    localMarkets.factoryMarkets.contractMarkets.length === 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="Filtered Volume" value={formatUsd(totalVolume)} />
        <SummaryMetric label="Active Markets" value={String(activeMarkets)} />
        <SummaryMetric label="Displayed Liquidity" value={formatUsd(totalLiquidity)} />
        <SummaryMetric
          label="Data Source"
          value={localMarkets.isLoading ? "Checking..." : dataSourceLabel}
          valueClassName={dataSourceTone}
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.025] px-4 py-3">
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">
              {localMarkets.isUsingMockFallback
                ? "Mock fallback active"
                : `${contractSourceLabel} MarketFactory connected`}
            </div>
            <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
              {localMarkets.isUsingMockFallback
                ? localMarkets.fallbackReason
                : hasConnectedFactoryWithoutMarkets
                  ? "The configured MarketFactory is reachable, but it has not created any markets yet. Run the Arc seed script to publish demo markets."
                  : `${localMarkets.markets.length} market${
                      localMarkets.markets.length === 1 ? "" : "s"
                    } rendered from deployed PredictionMarket contracts.`}
            </p>
          </div>
          <div className="w-fit rounded-md border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            {localMarkets.factoryMarkets.marketDataMode}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3 sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-500 lg:w-80">
            <Search className="h-4 w-4 text-slate-600" />
            <span>Search coming with indexer data</span>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <FilterGroup
              label="Category"
              options={marketCategories}
              value={category}
              onChange={setCategory}
            />
            <FilterGroup
              label="Status"
              options={marketStatuses}
              value={status}
              onChange={setStatus}
            />
          </div>
        </div>
      </div>

      {filteredMarkets.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : hasConnectedFactoryWithoutMarkets ? (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-10 text-center">
          <div className="text-sm font-medium text-white">No deployed markets found.</div>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-cyan-100/80">
            Probity is connected to the configured MarketFactory, but `allMarkets()` returned an
            empty list. Seed Arc testnet demo markets, then refresh this page.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/70 p-10 text-center">
          <div className="text-sm font-medium text-white">No markets match these filters.</div>
          <p className="mt-2 text-sm text-slate-500">Adjust the category or status filters.</p>
        </div>
      )}

      <ExternalSignals />
    </div>
  );
}

function getMarketsByFilter(
  markets: Market[],
  category: "All" | MarketCategory,
  status: "All" | MarketStatus
) {
  return markets.filter((market) => {
    const categoryMatches = category === "All" || market.category === category;
    const statusMatches = status === "All" || market.status === status;

    return categoryMatches && statusMatches;
  });
}

function SummaryMetric({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_1px_0_rgba(255,255,255,0.035)_inset]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={cn("mt-2 truncate text-2xl font-semibold text-white sm:text-3xl", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:mr-1">{label}</span>
      <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          className={cn(
            "h-8 border-white/10 px-3 text-xs",
            value === option &&
              "border-cyan-300/60 bg-cyan-400/15 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.10)]"
          )}
          key={option}
          onClick={() => onChange(option)}
          size="sm"
          type="button"
          variant={value === option ? "outline" : "secondary"}
        >
          {option}
        </Button>
      ))}
      </div>
    </div>
  );
}
