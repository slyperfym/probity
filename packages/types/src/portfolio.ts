import type { EntityId, HexAddress, HexHash } from "./contract";
import type { MarketCategory, MarketSide } from "./market";

export type PositionEntity = {
  id: EntityId;
  user: HexAddress;
  marketId: EntityId;
  marketAddress: HexAddress;
  side: MarketSide;
  shares: bigint;
  costBasis: bigint;
  averagePriceBps: number;
  realizedPayout: bigint;
  claimed: boolean;
  updatedAtBlock: bigint;
};

export type PositionHistoryEntity = {
  id: EntityId;
  positionId: EntityId;
  user: HexAddress;
  marketId: EntityId;
  side: MarketSide;
  type: "buy" | "claim" | "resolve";
  shareDelta: bigint;
  cashDelta: bigint;
  transactionHash: HexHash;
  timestamp: number;
};

export type PortfolioAnalytics = {
  user: HexAddress;
  openPositions: number;
  totalCostBasisUsd: number;
  totalCurrentValueUsd: number;
  totalClaimableUsd: number;
  realizedPayoutUsd: number;
  netPnLUsd: number;
};

export type PortfolioPositionView = {
  id: EntityId;
  marketId: EntityId;
  marketTitle: string;
  category: MarketCategory;
  side: MarketSide;
  shares: number;
  averagePrice: number;
  currentProbability: number;
  notionalUsd: number;
  status: "active" | "claimable" | "claimed" | "expired";
  claimableUsd: number;
};
