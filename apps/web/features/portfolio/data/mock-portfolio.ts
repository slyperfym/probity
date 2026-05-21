import type { PortfolioActivity, PortfolioPosition } from "@/features/portfolio/types";

export const mockPortfolioPositions: PortfolioPosition[] = [
  {
    id: "pos-fed-yes",
    marketId: "fed-cut-next-fomc",
    marketTitle: "Will the Fed cut rates at the next FOMC meeting?",
    category: "Macro",
    side: "YES",
    shares: 8400,
    averagePrice: 0.58,
    currentProbability: 0.64,
    notionalUsd: 5376,
    status: "active",
    claimableUsd: 0
  },
  {
    id: "pos-eth-no",
    marketId: "eth-etf-weekly-inflows-1b",
    marketTitle: "Will spot ETH ETF weekly inflows exceed $1B this month?",
    category: "Crypto",
    side: "NO",
    shares: 5200,
    averagePrice: 0.55,
    currentProbability: 0.59,
    notionalUsd: 3068,
    status: "active",
    claimableUsd: 0
  },
  {
    id: "pos-nvda-yes",
    marketId: "nvidia-guidance-beat",
    marketTitle: "Will NVIDIA next-quarter revenue guidance exceed consensus?",
    category: "Earnings",
    side: "YES",
    shares: 3000,
    averagePrice: 0.69,
    currentProbability: 1,
    notionalUsd: 3000,
    status: "claimable",
    claimableUsd: 3660
  }
];

export const mockPortfolioActivity: PortfolioActivity[] = [
  {
    id: "act-1",
    marketTitle: "Will NVIDIA next-quarter revenue guidance exceed consensus?",
    action: "Market resolved",
    amount: "YES",
    timestamp: "2026-05-10T21:14:00.000Z"
  },
  {
    id: "act-2",
    marketTitle: "Will spot ETH ETF weekly inflows exceed $1B this month?",
    action: "Bought NO",
    amount: "2,500 USDC",
    timestamp: "2026-05-18T14:22:00.000Z"
  },
  {
    id: "act-3",
    marketTitle: "Will the Fed cut rates at the next FOMC meeting?",
    action: "Bought YES",
    amount: "4,875 USDC",
    timestamp: "2026-05-16T09:41:00.000Z"
  }
];
