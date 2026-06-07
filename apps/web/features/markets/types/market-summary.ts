import type { ExternalReferenceMetadata } from "@/features/discovery/types";
import type { MarketCategory, MarketOutcome, MarketStatus } from "@/features/markets/types";

export type MarketSummary = {
  address: string;
  category: MarketCategory;
  expiresAt: string;
  externalReference?: ExternalReferenceMetadata | null;
  liquidityUsd: number;
  noProbability: number;
  outcome: MarketOutcome;
  sourceType: "contracts" | "mock";
  settlementTokenSymbol: string;
  status: MarketStatus;
  title: string;
  updatedAt: string;
  volumeUsd: number;
  yesProbability: number;
};

export type MarketSummaryResponse = {
  error?: string;
  generatedAt: string;
  isUsingMockFallback: boolean;
  markets: MarketSummary[];
  source: "contracts" | "mock";
  summaryStatus?: "fresh" | "cached" | "partial";
  total: number;
  warnings?: string[];
};
