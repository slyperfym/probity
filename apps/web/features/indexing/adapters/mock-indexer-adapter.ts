import type {
  ActivityFeedItem,
  HexAddress,
  IndexerSyncState,
  MarketEntity,
  PortfolioAnalytics,
  PortfolioQuery,
  PositionEntity,
  PositionHistoryEntity,
  TradeHistoryItem
} from "@probity/types";

import { mockMarkets } from "@/features/markets/data/mock-markets";
import { mockPortfolioActivity, mockPortfolioPositions } from "@/features/portfolio/data/mock-portfolio";
import type { ProbityIndexerAdapter } from "@/features/indexing/adapters/indexer-adapter";

const MOCK_USER = "0x0000000000000000000000000000000000000000" as HexAddress;

export const mockIndexerAdapter: ProbityIndexerAdapter = {
  source: "mock",
  async getActivityFeed() {
    return mockPortfolioActivity.map<ActivityFeedItem>((item) => ({
      description: `${item.marketTitle} - ${item.amount}`,
      eventName: item.action === "Market resolved" ? "MarketResolved" : "SharesPurchased",
      id: item.id,
      timestamp: item.timestamp,
      title: item.action,
      transactionHash: `0x${item.id.padEnd(64, "0").slice(0, 64)}` as `0x${string}`
    }));
  },
  async getMarket(marketIdOrAddress) {
    return this.getMarkets().then((markets) =>
      markets.find((market) => market.id === marketIdOrAddress || market.address === marketIdOrAddress) ?? null
    );
  },
  async getMarketSnapshots() {
    return [];
  },
  async getMarkets() {
    return mockMarkets.map<MarketEntity>((market) => ({
      address: `0x${market.id.padEnd(40, "0").slice(0, 40)}` as HexAddress,
      category: market.category,
      createdAtBlock: 0n,
      createdAtTimestamp: Date.parse(market.expiresAt) / 1000,
      creator: MOCK_USER,
      expirationTime: BigInt(Math.floor(Date.parse(market.expiresAt) / 1000)),
      id: market.id,
      metadataURI: `mock://probity/${market.id}`,
      outcome: market.outcome === "yes" ? "YES" : market.outcome === "no" ? "NO" : "UNRESOLVED",
      resolver: MOCK_USER,
      settlementToken: MOCK_USER,
      status: market.status === "expired" ? "expired" : market.status,
      title: market.title,
      totalDeposited: BigInt(Math.round(market.volumeUsd * 1_000_000)),
      totalNoShares: BigInt(100 - market.yesProbability),
      totalYesShares: BigInt(market.yesProbability),
      updatedAtBlock: 0n
    }));
  },
  async getSyncState(): Promise<IndexerSyncState> {
    return {
      isBackfilling: false,
      latestIndexedBlock: 0n,
      updatedAt: new Date(0).toISOString()
    };
  },
  async getTrades(): Promise<TradeHistoryItem[]> {
    return [];
  },
  async getTransactionEvents() {
    return [];
  },
  async getUserPortfolioAnalytics(): Promise<PortfolioAnalytics> {
    const totalCurrentValueUsd = mockPortfolioPositions.reduce((sum, position) => sum + position.notionalUsd, 0);
    const totalClaimableUsd = mockPortfolioPositions.reduce((sum, position) => sum + position.claimableUsd, 0);

    return {
      netPnLUsd: totalClaimableUsd,
      openPositions: mockPortfolioPositions.length,
      realizedPayoutUsd: 0,
      totalClaimableUsd,
      totalCostBasisUsd: totalCurrentValueUsd,
      totalCurrentValueUsd,
      user: MOCK_USER
    };
  },
  async getUserPositionHistory(): Promise<PositionHistoryEntity[]> {
    return [];
  },
  async getUserPositions(query: PortfolioQuery): Promise<PositionEntity[]> {
    return mockPortfolioPositions.map((position) => ({
      averagePriceBps: Math.round(position.averagePrice * 10_000),
      claimed: position.status === "claimed",
      costBasis: BigInt(Math.round(position.notionalUsd * 1_000_000)),
      id: position.id,
      marketAddress: `0x${position.marketId.padEnd(40, "0").slice(0, 40)}` as HexAddress,
      marketId: position.marketId,
      realizedPayout: BigInt(Math.round(position.claimableUsd * 1_000_000)),
      shares: BigInt(Math.round(position.shares * 1_000_000)),
      side: position.side,
      updatedAtBlock: 0n,
      user: query.user
    }));
  },
  async ingestProtocolEvents() {
    return undefined;
  }
};
