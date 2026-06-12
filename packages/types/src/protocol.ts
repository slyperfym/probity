import type { HexAddress, HexHash, IndexedBlockRef } from "./contract";

export type ProtocolEventName =
  | "MarketCreated"
  | "SharesPurchased"
  | "MarketResolved"
  | "MarketCancelled"
  | "WinningsClaimed"
  | "RefundClaimed"
  | "ResolverApprovalUpdated"
  | "CreatorApprovalUpdated";

export type MarketCreatedEvent = IndexedBlockRef & {
  eventName: "MarketCreated";
  market: HexAddress;
  creator: HexAddress;
  settlementToken: HexAddress;
  resolver: HexAddress;
  expirationTime: bigint;
  title: string;
  metadataURI: string;
};

export type SharesPurchasedEvent = IndexedBlockRef & {
  eventName: "SharesPurchased";
  market: HexAddress;
  buyer: HexAddress;
  side: "YES" | "NO";
  amount: bigint;
  shares: bigint;
  totalYesShares: bigint;
  totalNoShares: bigint;
};

export type MarketResolvedEvent = IndexedBlockRef & {
  eventName: "MarketResolved";
  market: HexAddress;
  resolver: HexAddress;
  outcome: "YES" | "NO";
  totalDeposited: bigint;
};

export type MarketCancelledEvent = IndexedBlockRef & {
  eventName: "MarketCancelled";
  market: HexAddress;
  canceller: HexAddress;
};

export type WinningsClaimedEvent = IndexedBlockRef & {
  eventName: "WinningsClaimed";
  market: HexAddress;
  user: HexAddress;
  amount: bigint;
};

export type RefundClaimedEvent = IndexedBlockRef & {
  eventName: "RefundClaimed";
  market: HexAddress;
  user: HexAddress;
  amount: bigint;
};

export type ApprovalEvent = IndexedBlockRef & {
  eventName: "ResolverApprovalUpdated" | "CreatorApprovalUpdated";
  account: HexAddress;
  approved: boolean;
};

export type ProbityProtocolEvent =
  | MarketCreatedEvent
  | SharesPurchasedEvent
  | MarketResolvedEvent
  | MarketCancelledEvent
  | WinningsClaimedEvent
  | RefundClaimedEvent
  | ApprovalEvent;

export type ActivityFeedItem = {
  id: string;
  eventName: ProtocolEventName;
  title: string;
  description: string;
  actor?: HexAddress;
  marketAddress?: HexAddress;
  transactionHash: HexHash;
  timestamp: string;
};
