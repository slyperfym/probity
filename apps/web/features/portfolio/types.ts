export type PortfolioSide = "YES" | "NO";

export type PortfolioPosition = {
  id: string;
  marketId: string;
  marketTitle: string;
  category: string;
  side: PortfolioSide;
  shares: number;
  yesShares?: number;
  noShares?: number;
  averagePrice: number;
  currentProbability: number;
  notionalUsd: number;
  status: "active" | "claimable" | "claimed" | "expired" | "refundable";
  marketStatus?: string;
  marketOutcome?: "yes" | "no" | null;
  claimStatus?: string;
  expiresAt?: string;
  settlementToken?: string;
  claimableUsd: number;
  canClaim?: boolean;
  canRefund?: boolean;
};

export type PortfolioActivity = {
  id: string;
  marketTitle: string;
  action: "Bought YES" | "Bought NO" | "Claimed" | "Market resolved";
  amount: string;
  timestamp: string;
};
