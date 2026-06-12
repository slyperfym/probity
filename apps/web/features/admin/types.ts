export type ResolverMarket = {
  contractAddress?: `0x${string}`;
  id: string;
  marketId: string;
  title: string;
  category: string;
  expiry: string;
  volumeUsd: number;
  status: "active" | "awaiting_resolution" | "resolved" | "cancel_review" | "cancelled";
  proposedOutcome: "YES" | "NO" | "INVALID" | null;
  resolver: string;
  resolverAddress?: `0x${string}`;
};
