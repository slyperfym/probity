import type { EntityId, HexAddress, HexHash } from "./contract";
import type { MarketEntity, MarketSnapshotEntity } from "./market";
import type { PortfolioAnalytics, PositionEntity, PositionHistoryEntity } from "./portfolio";
import type { ActivityFeedItem, ProbityProtocolEvent } from "./protocol";
import type { TradeEntity, TradeHistoryItem } from "./trade";

export type IndexerCursor = {
  blockNumber: bigint;
  logIndex: number;
};

export type IndexerSyncState = {
  latestIndexedBlock: bigint;
  latestFinalizedBlock?: bigint;
  cursor?: IndexerCursor;
  isBackfilling: boolean;
  updatedAt: string;
};

export type MarketQuery = {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  cursor?: string;
};

export type PortfolioQuery = {
  user: HexAddress;
  includeClosed?: boolean;
};

export type IndexerAdapter = {
  getSyncState(): Promise<IndexerSyncState>;
  getMarkets(query?: MarketQuery): Promise<MarketEntity[]>;
  getMarket(marketIdOrAddress: EntityId | HexAddress): Promise<MarketEntity | null>;
  getMarketSnapshots(marketId: EntityId): Promise<MarketSnapshotEntity[]>;
  getTrades(marketId?: EntityId): Promise<TradeHistoryItem[]>;
  getActivityFeed(marketId?: EntityId): Promise<ActivityFeedItem[]>;
  getUserPositions(query: PortfolioQuery): Promise<PositionEntity[]>;
  getUserPositionHistory(query: PortfolioQuery): Promise<PositionHistoryEntity[]>;
  getUserPortfolioAnalytics(query: PortfolioQuery): Promise<PortfolioAnalytics>;
  ingestProtocolEvents?(events: ProbityProtocolEvent[]): Promise<void>;
  getTransactionEvents?(transactionHash: HexHash): Promise<ProbityProtocolEvent[]>;
};

export type IndexerEntitySet = {
  markets: MarketEntity[];
  snapshots: MarketSnapshotEntity[];
  trades: TradeEntity[];
  positions: PositionEntity[];
  positionHistory: PositionHistoryEntity[];
  activity: ActivityFeedItem[];
};
