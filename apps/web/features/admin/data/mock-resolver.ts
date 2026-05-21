import type { ResolverMarket } from "@/features/admin/types";

export const mockResolverMarkets: ResolverMarket[] = [
  {
    id: "res-btc-quarter",
    marketId: "btc-above-120k-quarter-end",
    title: "Will BTC close above $120K at quarter end?",
    category: "Crypto",
    expiry: "2026-05-15T23:59:59.000Z",
    volumeUsd: 22_640_000,
    status: "awaiting_resolution",
    proposedOutcome: null,
    resolver: "Probity Crypto Desk"
  },
  {
    id: "res-nvda-guidance",
    marketId: "nvidia-guidance-beat",
    title: "Will NVIDIA next-quarter revenue guidance exceed consensus?",
    category: "Earnings",
    expiry: "2026-05-10T20:00:00.000Z",
    volumeUsd: 13_780_000,
    status: "resolved",
    proposedOutcome: "YES",
    resolver: "Probity Earnings Desk"
  },
  {
    id: "res-arc-pilot",
    marketId: "arc-usdc-gas-pilot",
    title: "Will Arc announce a public stablecoin gas pilot before Q3?",
    category: "Arc",
    expiry: "2026-06-30T23:59:59.000Z",
    volumeUsd: 4_960_000,
    status: "cancel_review",
    proposedOutcome: "INVALID",
    resolver: "Probity Arc Desk"
  }
];
