import type { ExternalReferenceMetadata } from "@/features/discovery/types";

export type MarketCategory = "Macro" | "Crypto" | "Policy" | "Arc" | "Earnings";

export type MarketStatus = "active" | "expired" | "resolved" | "cancelled";

export type MarketOutcome = "yes" | "no" | null;

export type Market = {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  yesProbability: number;
  volumeUsd: number;
  liquidityUsd: number;
  expiresAt: string;
  settlementToken: string;
  settlementTokenAddress?: `0x${string}`;
  resolver: string;
  resolverAddress?: `0x${string}`;
  resolutionEvidence?: string;
  rules: string[];
  outcome: MarketOutcome;
  participants: number;
  change24h: number;
  metadataURI?: string;
  externalReference?: ExternalReferenceMetadata | null;
};
