import type { EntityId, HexAddress } from "./contract";

export type MarketSide = "YES" | "NO";
export type MarketCategory = "Macro" | "Crypto" | "Policy" | "Arc" | "Earnings" | "Other";
export type MarketStatus = "active" | "expired" | "resolved" | "cancelled";
export type MarketOutcome = "YES" | "NO" | "UNRESOLVED";

export type MarketEntity = {
  id: EntityId;
  address: HexAddress;
  creator: HexAddress;
  resolver: HexAddress;
  settlementToken: HexAddress;
  title: string;
  metadataURI: string;
  category: MarketCategory;
  status: MarketStatus;
  outcome: MarketOutcome;
  expirationTime: bigint;
  createdAtBlock: bigint;
  createdAtTimestamp?: number;
  totalYesShares: bigint;
  totalNoShares: bigint;
  totalDeposited: bigint;
  updatedAtBlock: bigint;
};

export type MarketSnapshotEntity = {
  id: EntityId;
  marketId: EntityId;
  blockNumber: bigint;
  timestamp: number;
  yesShares: bigint;
  noShares: bigint;
  totalDeposited: bigint;
  yesProbabilityBps: number;
  volumeDelta: bigint;
  liquidity: bigint;
  tradeCount: number;
};

export type MarketAnalytics = {
  marketId: EntityId;
  yesProbability: number;
  noProbability: number;
  liquidityUsd: number;
  volumeUsd: number;
  imbalanceBps: number;
  isTradable: boolean;
};
