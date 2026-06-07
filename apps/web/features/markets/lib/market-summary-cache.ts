import type { MarketSummaryResponse } from "@/features/markets/types/market-summary";

const SUMMARY_CACHE_KEY = "probity-real-market-summaries";
const SUMMARY_CACHE_TTL_MS = 5 * 60_000;

export type CachedMarketSummaryEntry = {
  cachedAt: number;
  response: MarketSummaryResponse;
};

export function readCachedMarketSummaries() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawValue = window.localStorage.getItem(SUMMARY_CACHE_KEY);

    if (!rawValue) {
      return undefined;
    }

    const parsed = JSON.parse(rawValue) as Partial<CachedMarketSummaryEntry>;

    if (!parsed.cachedAt || !parsed.response || Date.now() - parsed.cachedAt > SUMMARY_CACHE_TTL_MS) {
      window.localStorage.removeItem(SUMMARY_CACHE_KEY);
      return undefined;
    }

    return isCacheableSummaryResponse(parsed.response)
      ? {
          cachedAt: parsed.cachedAt,
          response: parsed.response
        }
      : undefined;
  } catch {
    window.localStorage.removeItem(SUMMARY_CACHE_KEY);
    return undefined;
  }
}

export function writeCachedMarketSummaries(response: MarketSummaryResponse) {
  if (typeof window === "undefined" || !isCacheableSummaryResponse(response)) {
    return undefined;
  }

  const entry = {
    cachedAt: Date.now(),
    response
  };

  window.localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(entry));

  return entry;
}

export function isCacheableSummaryResponse(
  response: MarketSummaryResponse | undefined
): response is MarketSummaryResponse {
  return Boolean(
    response &&
      !response.isUsingMockFallback &&
      response.source === "contracts" &&
      response.markets.length > 0
  );
}
