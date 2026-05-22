import type { ExternalMarketReference } from "@/features/discovery/types";
import type { MarketCategory } from "@/features/markets/types";

const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";

type GammaMarket = {
  id?: string | number;
  question?: string;
  title?: string;
  category?: string;
  volume?: string | number;
  volumeNum?: string | number;
  liquidity?: string | number;
  liquidityNum?: string | number;
  outcomes?: string[] | string;
  outcomePrices?: string[] | string;
  endDate?: string | null;
  endDateIso?: string | null;
  slug?: string;
};

export async function fetchPolymarketReferences(limit = 8): Promise<ExternalMarketReference[]> {
  const url = new URL(GAMMA_MARKETS_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", "volume");
  url.searchParams.set("ascending", "false");

  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 120
    }
  });

  if (!response.ok) {
    throw new Error(`Polymarket Gamma request failed with ${response.status}`);
  }

  const data = (await response.json()) as GammaMarket[];

  return data
    .map(mapGammaMarket)
    .filter((market): market is ExternalMarketReference => Boolean(market));
}

function mapGammaMarket(market: GammaMarket): ExternalMarketReference | null {
  const question = market.question ?? market.title;
  const outcomes = parseStringArray(market.outcomes);
  const outcomePrices = parseNumberArray(market.outcomePrices);

  if (!market.id || !question || !isBinaryYesNo(outcomes)) {
    return null;
  }

  return {
    category: mapCategory(market.category, question),
    endDate: market.endDateIso ?? market.endDate ?? null,
    id: String(market.id),
    liquidityUsd: readNumber(market.liquidityNum ?? market.liquidity),
    outcomePrices,
    outcomes,
    probability: inferYesProbability(outcomes, outcomePrices),
    question,
    source: "Polymarket",
    url: market.slug ? `https://polymarket.com/market/${market.slug}` : undefined,
    volumeUsd: readNumber(market.volumeNum ?? market.volume)
  };
}

function parseStringArray(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseNumberArray(value: string[] | string | undefined) {
  return parseStringArray(value)
    .map(Number)
    .filter((item) => Number.isFinite(item));
}

function isBinaryYesNo(outcomes: string[]) {
  const normalized = outcomes.map((outcome) => outcome.toLowerCase());
  return normalized.length === 2 && normalized.includes("yes") && normalized.includes("no");
}

function inferYesProbability(outcomes: string[], prices: number[]) {
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const price = prices[yesIndex];

  return Number.isFinite(price) ? Math.round(price * 100) : null;
}

function readNumber(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapCategory(category: string | undefined, question: string): MarketCategory {
  const source = `${category ?? ""} ${question}`.toLowerCase();

  if (source.includes("crypto") || source.includes("btc") || source.includes("eth")) return "Crypto";
  if (source.includes("arc") || source.includes("stablecoin")) return "Arc";
  if (source.includes("election") || source.includes("congress") || source.includes("policy")) return "Policy";
  if (source.includes("earnings") || source.includes("revenue")) return "Earnings";

  return "Macro";
}
