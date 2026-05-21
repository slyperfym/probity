import type { EntityId, HexAddress, HexHash, IndexedBlockRef } from "./contract";
import type { MarketSide } from "./market";

export type TradeEntity = IndexedBlockRef & {
  id: EntityId;
  marketId: EntityId;
  marketAddress: HexAddress;
  trader: HexAddress;
  side: MarketSide;
  amount: bigint;
  shares: bigint;
  totalYesSharesAfter: bigint;
  totalNoSharesAfter: bigint;
};

export type TradeHistoryItem = {
  id: EntityId;
  marketId: EntityId;
  marketTitle: string;
  trader: HexAddress;
  side: MarketSide;
  amountUsd: number;
  shares: number;
  transactionHash: HexHash;
  timestamp: string;
};
