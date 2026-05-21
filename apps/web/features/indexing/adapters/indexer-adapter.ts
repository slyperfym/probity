import type { IndexerAdapter } from "@probity/types";

export type IndexerSource = "mock" | "local-contracts" | "external-indexer";

export type ProbityIndexerAdapter = IndexerAdapter & {
  source: IndexerSource;
};

export function createUnavailableIndexerAdapter(source: IndexerSource = "external-indexer"): ProbityIndexerAdapter {
  async function unavailable(): Promise<never> {
    throw new Error(`Probity ${source} adapter is not configured yet.`);
  }

  return {
    source,
    getActivityFeed: unavailable,
    getMarket: unavailable,
    getMarketSnapshots: unavailable,
    getMarkets: unavailable,
    getSyncState: unavailable,
    getTrades: unavailable,
    getTransactionEvents: unavailable,
    getUserPortfolioAnalytics: unavailable,
    getUserPositionHistory: unavailable,
    getUserPositions: unavailable,
    ingestProtocolEvents: unavailable
  };
}
