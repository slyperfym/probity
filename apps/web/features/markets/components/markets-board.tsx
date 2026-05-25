"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { deploymentConfig } from "@/config/contracts";
import { ExternalSignals } from "@/features/discovery/components/external-signals";
import { MarketCard } from "@/features/markets/components/market-card";
import {
  marketCategories,
  marketStatuses
} from "@/features/markets/data/mock-markets";
import { formatUsd } from "@/features/markets/lib/formatters";
import type { Market, MarketCategory, MarketStatus } from "@/features/markets/types";
import type { MarketSummary, MarketSummaryResponse } from "@/features/markets/types/market-summary";
import { cn } from "@/lib/utils";

type CategoryFilter = (typeof marketCategories)[number];
type StatusFilter = (typeof marketStatuses)[number];

const MARKET_PAGE_SIZE = 9;

export function MarketsBoard() {
  const [category, setCategory] = React.useState<CategoryFilter>("All");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleMarketLimit, setVisibleMarketLimit] = React.useState(MARKET_PAGE_SIZE);
  const [refreshNonce, setRefreshNonce] = React.useState(0);
  const summaryQuery = useQuery({
    queryFn: () => fetchMarketSummaries(refreshNonce > 0),
    queryKey: ["probity", "market-summaries", refreshNonce],
    placeholderData: (previousData) => previousData,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 25_000
  });
  const summaryData = summaryQuery.data;
  const summaryMarkets = React.useMemo(
    () => (summaryData?.markets ?? []).map(mapSummaryToMarket),
    [summaryData?.markets]
  );
  const displayedMarkets = summaryMarkets.slice(0, visibleMarketLimit);
  const totalMarketCount = summaryData?.total ?? 0;
  const hasMoreMarkets = visibleMarketLimit < totalMarketCount;

  const filteredMarkets = getMarketsByFilter(
    displayedMarkets,
    category as "All" | MarketCategory,
    status as "All" | MarketStatus,
    searchQuery
  );
  const activeMarkets = filteredMarkets.filter((market) => market.status === "active").length;
  const totalVolume = filteredMarkets.reduce((sum, market) => sum + market.volumeUsd, 0);
  const totalLiquidity = filteredMarkets.reduce((sum, market) => sum + market.liquidityUsd, 0);
  const isUsingMockFallback = summaryData?.isUsingMockFallback ?? false;
  const dataSourceTone = isUsingMockFallback ? "text-amber-300/85" : "text-emerald-300/85";
  const hasConnectedFactoryWithoutMarkets =
    !summaryQuery.isLoading &&
    !isUsingMockFallback &&
    totalMarketCount === 0;
  const lastUpdatedLabel = summaryData?.generatedAt
    ? formatLastUpdated(summaryData.generatedAt)
    : "Not loaded";
  const isInitialLoading = summaryQuery.isLoading && !summaryData;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="Filtered Volume" value={formatUsd(totalVolume)} />
        <SummaryMetric label="Loaded Active" value={String(activeMarkets)} />
        <SummaryMetric label="Displayed Liquidity" value={formatUsd(totalLiquidity)} />
        <SummaryMetric
          label="Loaded / Total"
          value={isInitialLoading ? "Checking..." : `${displayedMarkets.length}/${totalMarketCount}`}
          valueClassName={dataSourceTone}
        />
      </div>

      <div className="rounded-md border border-white/[0.07] bg-white/[0.018] px-3 py-2">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
            <span className="font-medium text-slate-400">
              {isUsingMockFallback
                ? "Mock fallback active"
                : deploymentConfig.isArcTestnet
                  ? "Arc MarketFactory connected"
                  : "Local MarketFactory connected"}
            </span>
            <span className="hidden text-slate-700 sm:inline">/</span>
            <span>
              {isUsingMockFallback
                ? "Cached mock summaries are active because contracts are unavailable or mock mode is configured."
                : hasConnectedFactoryWithoutMarkets
                  ? "0 markets"
                  : `${displayedMarkets.length} of ${totalMarketCount} market${
                      totalMarketCount === 1 ? "" : "s"
                    }`}
            </span>
            {!isUsingMockFallback && totalMarketCount > displayedMarkets.length && (
              <span className="text-slate-600">Board summaries are cached; detail pages read live contracts.</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600">Last updated {lastUpdatedLabel}</span>
            <Button
              className="h-7 border-white/[0.08] px-2 text-[10px] uppercase tracking-[0.14em] text-slate-500"
              disabled={summaryQuery.isFetching}
              onClick={() => setRefreshNonce((current) => current + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw className={cn("h-3 w-3", summaryQuery.isFetching && "animate-spin")} />
              Refresh onchain data
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.07] bg-slate-950/50 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <label className="flex min-h-9 items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.018] px-3 text-sm text-slate-500 transition focus-within:border-cyan-300/20 lg:w-80">
            <Search className="h-4 w-4 text-slate-600" />
            <input
              aria-label="Search markets"
              className="min-w-0 flex-1 bg-transparent text-slate-300 outline-none placeholder:text-slate-600"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search markets..."
              type="search"
              value={searchQuery}
            />
          </label>
          <div className="flex flex-col gap-2.5 lg:items-end">
            <span className="text-xs text-slate-600">Search applies to loaded markets.</span>
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
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
          {hasMoreMarkets && (
            <div className="flex justify-center">
              <Button
                className="border-white/[0.08] text-slate-300"
                disabled={summaryQuery.isFetching && !summaryData}
                onClick={() => setVisibleMarketLimit((current) => current + MARKET_PAGE_SIZE)}
                type="button"
                variant="outline"
              >
                {summaryQuery.isFetching && !summaryData ? "Loading markets..." : "Load more markets"}
              </Button>
            </div>
          )}
        </>
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
          <div className="text-sm font-medium text-white">
            {summaryQuery.isError
              ? "Market summaries are unavailable."
              : searchQuery.trim()
                ? "No markets match your search."
                : "No markets match these filters."}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {summaryQuery.isError
              ? "Refresh onchain data or try again shortly."
              : searchQuery.trim()
              ? "Try another question, category, status, or token symbol."
              : "Adjust the category or status filters."}
          </p>
        </div>
      )}

      <ExternalSignals
        isUsingMockFallback={isUsingMockFallback}
        probityMarkets={summaryMarkets}
      />
    </div>
  );
}

async function fetchMarketSummaries(forceRefresh: boolean) {
  const response = await fetch(`/api/markets/summary${forceRefresh ? "?refresh=1" : ""}`);

  if (!response.ok) {
    throw new Error("Unable to load market summaries.");
  }

  return await response.json() as MarketSummaryResponse;
}

function mapSummaryToMarket(summary: MarketSummary): Market {
  return {
    category: summary.category,
    change24h: 0,
    description: "Cached onchain market summary. Open the market for live contract details.",
    expiresAt: summary.expiresAt,
    externalReference: summary.externalReference,
    id: summary.address,
    liquidityUsd: summary.liquidityUsd,
    metadataURI: undefined,
    outcome: null,
    participants: 0,
    resolver: "Open market",
    rules: [],
    settlementToken: summary.settlementTokenSymbol,
    status: summary.status,
    title: summary.title,
    volumeUsd: summary.volumeUsd,
    yesProbability: summary.yesProbability
  };
}

function formatLastUpdated(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (elapsedSeconds < 5) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  return `${Math.floor(elapsedSeconds / 60)}m ago`;
}

function getMarketsByFilter(
  markets: Market[],
  category: "All" | MarketCategory,
  status: "All" | MarketStatus,
  searchQuery: string
) {
  const normalizedSearch = normalizeSearch(searchQuery);

  return markets.filter((market) => {
    const categoryMatches = category === "All" || market.category === category;
    const statusMatches = status === "All" || market.status === status;
    const searchMatches =
      !normalizedSearch ||
      normalizeSearch(
        [
          market.title,
          market.category,
          market.status,
          market.settlementToken,
          market.externalReference?.externalQuestion
        ].join(" ")
      ).includes(normalizedSearch);

    return categoryMatches && statusMatches && searchMatches;
  });
}

function normalizeSearch(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
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
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_1px_0_rgba(255,255,255,0.025)_inset]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={cn("mt-2 truncate text-2xl font-semibold text-slate-100 sm:text-3xl", valueClassName)}>
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
            "h-8 border-white/[0.08] px-3 text-xs text-slate-400",
            value === option &&
              "border-cyan-300/30 bg-cyan-400/[0.08] text-cyan-100 shadow-none"
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
