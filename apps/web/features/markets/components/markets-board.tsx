"use client";

import * as React from "react";
import { AlertTriangle, Inbox, LayoutGrid, List, Loader2, RefreshCw, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { deploymentConfig } from "@/config/contracts";
import { useLocalContractMarkets } from "@/features/contracts/hooks";
import { ExternalSignals } from "@/features/discovery/components/external-signals";
import { MarketCard } from "@/features/markets/components/market-card";
import {
  marketCategories,
  marketStatuses
} from "@/features/markets/data/mock-markets";
import { formatExpiry, formatUsd } from "@/features/markets/lib/formatters";
import type { Market, MarketCategory, MarketStatus } from "@/features/markets/types";
import type { MarketSummary, MarketSummaryResponse } from "@/features/markets/types/market-summary";
import { cn } from "@/lib/utils";

type CategoryFilter = (typeof marketCategories)[number];
type StatusFilter = (typeof marketStatuses)[number];

const MARKET_PAGE_SIZE = 9;
const SUMMARY_CACHE_KEY = "probity-real-market-summaries";
const SUMMARY_CACHE_TTL_MS = 60_000;

export function MarketsBoard() {
  const [category, setCategory] = React.useState<CategoryFilter>("All");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [visibleMarketLimit, setVisibleMarketLimit] = React.useState(MARKET_PAGE_SIZE);
  const [refreshNonce, setRefreshNonce] = React.useState(0);
  const [cachedSummaryData, setCachedSummaryData] = React.useState<MarketSummaryResponse | undefined>();
  const summaryQuery = useQuery({
    queryFn: () => fetchMarketSummaries(refreshNonce > 0),
    queryKey: ["probity", "market-summaries", refreshNonce],
    placeholderData: (previousData) => previousData,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 25_000
  });
  React.useEffect(() => {
    setCachedSummaryData(readCachedMarketSummaries());
  }, []);

  React.useEffect(() => {
    const nextSummaryData = summaryQuery.data;

    if (
      isCacheableSummaryResponse(nextSummaryData) &&
      (refreshNonce > 0 || !cachedSummaryData || nextSummaryData.markets.length >= cachedSummaryData.markets.length)
    ) {
      writeCachedMarketSummaries(nextSummaryData);
      setCachedSummaryData(nextSummaryData);
    }
  }, [cachedSummaryData, refreshNonce, summaryQuery.data]);

  const apiSummaryData = summaryQuery.data;
  const shouldAcceptApiData =
    shouldUseFreshSummary(apiSummaryData, cachedSummaryData) ||
    Boolean(refreshNonce > 0 && apiSummaryData && apiSummaryData.markets.length > 0) ||
    Boolean(apiSummaryData && apiSummaryData.total === 0 && !cachedSummaryData);
  const summaryData = shouldAcceptApiData ? apiSummaryData : cachedSummaryData;
  const isShowingCachedData = Boolean(summaryData && summaryData === cachedSummaryData && !shouldAcceptApiData);
  const isHoldingBetterCachedData = Boolean(
    apiSummaryData &&
      cachedSummaryData &&
      apiSummaryData.markets.length > 0 &&
      apiSummaryData.markets.length < cachedSummaryData.markets.length &&
      summaryData === cachedSummaryData
  );
  const summaryMarkets = React.useMemo(
    () => (summaryData?.markets ?? []).map(mapSummaryToMarket),
    [summaryData?.markets]
  );
  const shouldUseClientFallback =
    summaryQuery.isError ||
    Boolean(apiSummaryData && apiSummaryData.total > 0 && apiSummaryData.markets.length === 0 && !summaryData);
  const clientFallbackMarkets = useLocalContractMarkets({
    enabled: shouldUseClientFallback,
    limit: visibleMarketLimit
  });
  const isUsingClientFallback =
    shouldUseClientFallback &&
    !clientFallbackMarkets.isUsingMockFallback &&
    clientFallbackMarkets.markets.length > 0;
  const boardMarkets = isUsingClientFallback ? clientFallbackMarkets.markets : summaryMarkets;
  const displayedMarkets = boardMarkets.slice(0, visibleMarketLimit);
  const totalMarketCount = isUsingClientFallback
    ? clientFallbackMarkets.totalContractMarketCount
    : summaryData?.total ?? 0;
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
  const isUsingMockFallback = !isUsingClientFallback && (summaryData?.isUsingMockFallback ?? false);
  const dataSourceStatus = isUsingMockFallback
    ? "MOCK FALLBACK"
    : isUsingClientFallback
      ? "LIVE ONCHAIN RPC FALLBACK"
      : summaryData?.source === "contracts"
        ? "LIVE ONCHAIN"
        : "LOADING DATA SOURCE";
  const dataSourceTone = isUsingMockFallback ? "text-amber-700" : "text-emerald-700";
  const hasConnectedFactoryWithoutMarkets =
    !summaryQuery.isError &&
    !summaryQuery.isLoading &&
    !isUsingMockFallback &&
    totalMarketCount === 0;
  const lastUpdatedLabel = summaryData?.generatedAt
    ? isShowingCachedData
      ? formatCachedLastUpdated(summaryData.generatedAt)
      : formatLastUpdated(summaryData.generatedAt)
    : isUsingClientFallback
      ? "from wallet RPC"
      : "Not loaded";
  const isInitialLoading =
    (summaryQuery.isLoading && !summaryData) ||
    (shouldUseClientFallback && clientFallbackMarkets.isLoading && clientFallbackMarkets.markets.length === 0);
  const duplicateLabelByMarketId = React.useMemo(
    () => getDuplicateLabelByMarketId(displayedMarkets),
    [displayedMarkets]
  );

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="Filtered Volume" value={formatUsd(totalVolume)} />
        <SummaryMetric label="Loaded Active" value={String(activeMarkets)} />
        <SummaryMetric label="Displayed Liquidity" value={formatUsd(totalLiquidity)} />
        <SummaryMetric
          label="Loaded / Total"
          value={isInitialLoading ? "Checking..." : `${displayedMarkets.length}/${totalMarketCount}`}
          valueClassName={dataSourceTone}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                isUsingMockFallback
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              {dataSourceStatus}
            </span>
            <span className="font-medium text-slate-700">
              {isUsingMockFallback
                ? "Contracts unavailable"
                : deploymentConfig.isArcTestnet
                  ? "Arc Testnet"
                  : "Local contracts"}
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span>
              {isUsingMockFallback
                ? "Summaries unavailable."
                : isUsingClientFallback
                  ? "Real onchain markets"
                : hasConnectedFactoryWithoutMarkets
                  ? "0 markets"
                  : `${displayedMarkets.length} of ${totalMarketCount} market${
                      totalMarketCount === 1 ? "" : "s"
                    }`}
            </span>
            {!isUsingMockFallback && totalMarketCount > displayedMarkets.length && (
              <span className="text-slate-500">Real onchain markets</span>
            )}
            {summaryQuery.isError && clientFallbackMarkets.isLoading && clientFallbackMarkets.markets.length === 0 && (
              <span className="text-indigo-600">Reading markets...</span>
            )}
            {summaryQuery.isFetching && displayedMarkets.length > 0 && (
              <span className="text-indigo-600">Refreshing onchain data...</span>
            )}
            {(isHoldingBetterCachedData || (summaryData?.warnings && summaryData.warnings.length > 0)) &&
              displayedMarkets.length > 0 && (
                <span className="text-slate-500">Some markets are still syncing</span>
              )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-slate-500">Last updated {lastUpdatedLabel}</span>
            <Button
              className="h-8 px-2 text-[10px] uppercase tracking-[0.12em]"
              disabled={summaryQuery.isFetching}
              onClick={() => setRefreshNonce((current) => current + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw className={cn("h-3 w-3", summaryQuery.isFetching && "animate-spin")} />
              <span className="hidden sm:inline">Refresh onchain data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-h-11 w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 transition focus-within:border-indigo-300 focus-within:bg-white lg:w-96">
            <Search className="h-4 w-4 text-slate-600" />
            <input
              aria-label="Search markets"
              className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search markets..."
              type="search"
              value={searchQuery}
            />
          </label>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-12 xl:gap-y-3">
            <FilterGroup label="Category" options={marketCategories} value={category} onChange={setCategory} />
            <FilterGroup label="Status" options={marketStatuses} value={status} onChange={setStatus} />
          </div>
        </div>
      </div>

      {isInitialLoading ? (
        <BoardState
          description="Loading Arc Testnet markets..."
          icon={Loader2}
          kind="loading"
          title="Loading markets"
        />
      ) : filteredMarkets.length > 0 ? (
        <>
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"
            )}
          >
            {filteredMarkets.map((market) => (
              <MarketCard
                duplicateLabel={duplicateLabelByMarketId.get(market.id)}
                key={market.id}
                market={market}
                variant={viewMode}
              />
            ))}
          </div>
          {hasMoreMarkets && (
            <div className="flex justify-center">
              <Button
                className="w-full sm:w-auto"
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
        <BoardState
          description="Create an Arc Testnet market, then refresh."
          icon={Inbox}
          title="No deployed markets"
        />
      ) : (
        <BoardState
          description={
            summaryQuery.isError
              ? "Check MarketFactory configuration or RPC availability, then refresh."
              : searchQuery.trim()
                ? "Try another question, category, status, or token."
                : "Adjust category or status filters."
          }
          icon={summaryQuery.isError ? AlertTriangle : Inbox}
          kind={summaryQuery.isError ? "error" : "empty"}
          title={
            summaryQuery.isError
              ? "Could not load markets"
              : searchQuery.trim()
                ? "No search results"
                : "No matching markets"
          }
        />
      )}

      <ExternalSignals
        isUsingMockFallback={isUsingMockFallback}
        probityMarkets={boardMarkets}
      />
    </div>
  );
}

async function fetchMarketSummaries(forceRefresh: boolean) {
  const response = await fetch(`/api/markets/summary${forceRefresh ? "?refresh=1" : ""}`);
  const data = await response.json() as MarketSummaryResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Arc Testnet markets could not be loaded. Check MarketFactory configuration or RPC availability.");
  }

  return data;
}

function readCachedMarketSummaries() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawValue = window.localStorage.getItem(SUMMARY_CACHE_KEY);

    if (!rawValue) {
      return undefined;
    }

    const parsed = JSON.parse(rawValue) as { cachedAt?: number; response?: MarketSummaryResponse };

    if (!parsed.cachedAt || !parsed.response || Date.now() - parsed.cachedAt > SUMMARY_CACHE_TTL_MS) {
      window.localStorage.removeItem(SUMMARY_CACHE_KEY);
      return undefined;
    }

    return isCacheableSummaryResponse(parsed.response) ? parsed.response : undefined;
  } catch {
    window.localStorage.removeItem(SUMMARY_CACHE_KEY);
    return undefined;
  }
}

function writeCachedMarketSummaries(response: MarketSummaryResponse) {
  if (typeof window === "undefined" || !isCacheableSummaryResponse(response)) {
    return;
  }

  window.localStorage.setItem(
    SUMMARY_CACHE_KEY,
    JSON.stringify({
      cachedAt: Date.now(),
      response
    })
  );
}

function isCacheableSummaryResponse(
  response: MarketSummaryResponse | undefined
): response is MarketSummaryResponse {
  return Boolean(
    response &&
      !response.isUsingMockFallback &&
      response.source === "contracts" &&
      response.markets.length > 0
  );
}

function shouldUseFreshSummary(
  fresh: MarketSummaryResponse | undefined,
  cached: MarketSummaryResponse | undefined
) {
  if (!fresh) {
    return false;
  }

  if (fresh.total === 0 && !cached) {
    return true;
  }

  if (!isCacheableSummaryResponse(fresh)) {
    return false;
  }

  return !cached || fresh.markets.length >= cached.markets.length;
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

function formatCachedLastUpdated(value: string) {
  const label = formatLastUpdated(value);

  return label === "just now" ? "recently" : label;
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

function getDuplicateLabelByMarketId(markets: Market[]) {
  const groupedByTitle = new Map<string, Market[]>();

  markets.forEach((market) => {
    const key = normalizeSearch(market.title);
    groupedByTitle.set(key, [...(groupedByTitle.get(key) ?? []), market]);
  });

  const labels = new Map<string, string>();

  groupedByTitle.forEach((duplicateMarkets) => {
    if (duplicateMarkets.length < 2) {
      return;
    }

    duplicateMarkets.forEach((market) => {
      labels.set(market.id, shortAddressLabel(market.id));
    });
  });

  return labels;
}

function shortAddressLabel(value: string) {
  return value.startsWith("0x") && value.length > 10
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : "Duplicate listing";
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
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={cn("mt-1.5 truncate text-xl font-semibold text-slate-950 sm:mt-2 sm:text-2xl lg:text-3xl", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

function BoardState({
  description,
  icon: Icon,
  kind = "empty",
  title
}: {
  description: string;
  icon: LucideIcon;
  kind?: "empty" | "error" | "loading";
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-10">
      <div
        className={cn(
          "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border",
          kind === "error"
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : kind === "loading"
              ? "border-indigo-200 bg-indigo-50 text-indigo-600"
              : "border-slate-200 bg-slate-50 text-slate-500"
        )}
      >
        <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} />
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-950">{title}</div>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
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
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:mr-1">{label}</span>
      <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          className={cn(
            "h-8 rounded-full border-slate-200 px-3 text-xs shadow-none",
            value === option &&
              "border-indigo-300 bg-indigo-50 text-indigo-700"
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

function ViewToggle({
  value,
  onChange
}: {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
}) {
  return (
    <div className="grid w-fit grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1">
      {([
        { icon: LayoutGrid, label: "Grid", value: "grid" },
        { icon: List, label: "List", value: "list" }
      ] as const).map((item) => {
        const Icon = item.icon;

        return (
          <button
            aria-pressed={value === item.value}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
              value === item.value
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
            key={item.value}
            onClick={() => onChange(item.value)}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
