import type { MarketCategory } from "@/features/markets/types";

export type ExternalMarketReference = {
  id: string;
  question: string;
  category: MarketCategory;
  volumeUsd: number;
  liquidityUsd: number;
  outcomes: string[];
  outcomePrices: number[];
  endDate: string | null;
  probability: number | null;
  source: "Polymarket";
  url?: string;
};

export type ExternalReferenceMetadata = {
  externalId?: string;
  externalQuestion?: string;
  externalSourceLabel?: string;
  externalSourceUrl?: string;
  externalEndDate?: string;
  normalizedQuestionHash?: string;
};
