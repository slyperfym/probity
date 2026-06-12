import type {
  ActivityFeedItem,
  MarketCreatedEvent,
  MarketEntity,
  MarketSnapshotEntity,
  PositionHistoryEntity,
  ProbityProtocolEvent,
  SharesPurchasedEvent,
  TradeEntity
} from "@probity/types";

export function marketFromCreatedEvent(event: MarketCreatedEvent): MarketEntity {
  return {
    address: event.market,
    category: inferCategory(event.title),
    createdAtBlock: event.blockNumber,
    creator: event.creator,
    expirationTime: event.expirationTime,
    id: event.market,
    metadataURI: event.metadataURI,
    outcome: "UNRESOLVED",
    resolver: event.resolver,
    settlementToken: event.settlementToken,
    status: "active",
    title: event.title,
    totalDeposited: 0n,
    totalNoShares: 0n,
    totalYesShares: 0n,
    updatedAtBlock: event.blockNumber
  };
}

export function tradeFromPurchasedEvent(event: SharesPurchasedEvent): TradeEntity {
  return {
    ...event,
    id: `${event.transactionHash}-${event.logIndex ?? 0}`,
    marketAddress: event.market,
    marketId: event.market,
    trader: event.buyer,
    totalNoSharesAfter: event.totalNoShares,
    totalYesSharesAfter: event.totalYesShares
  };
}

export function snapshotFromTrade(event: SharesPurchasedEvent): MarketSnapshotEntity {
  const totalShares = event.totalYesShares + event.totalNoShares;
  const yesProbabilityBps =
    totalShares > 0n ? Number((event.totalYesShares * 10_000n) / totalShares) : 5_000;

  return {
    blockNumber: event.blockNumber,
    id: `${event.market}-${event.blockNumber}-${event.logIndex ?? 0}`,
    liquidity: event.totalYesShares + event.totalNoShares,
    marketId: event.market,
    noShares: event.totalNoShares,
    timestamp: 0,
    totalDeposited: event.totalYesShares + event.totalNoShares,
    tradeCount: 1,
    volumeDelta: event.amount,
    yesProbabilityBps,
    yesShares: event.totalYesShares
  };
}

export function positionHistoryFromEvent(event: ProbityProtocolEvent): PositionHistoryEntity | null {
  if (event.eventName === "SharesPurchased") {
    return {
      cashDelta: -event.amount,
      id: `${event.transactionHash}-${event.logIndex ?? 0}-position`,
      marketId: event.market,
      positionId: `${event.buyer}-${event.market}-${event.side}`,
      shareDelta: event.shares,
      side: event.side,
      timestamp: 0,
      transactionHash: event.transactionHash,
      type: "buy",
      user: event.buyer
    };
  }

  if (event.eventName === "WinningsClaimed" || event.eventName === "RefundClaimed") {
    return {
      cashDelta: event.amount,
      id: `${event.transactionHash}-${event.logIndex ?? 0}-${event.eventName === "RefundClaimed" ? "refund" : "claim"}`,
      marketId: event.market,
      positionId: `${event.user}-${event.market}-${event.eventName === "RefundClaimed" ? "refund" : "claim"}`,
      shareDelta: 0n,
      side: "YES",
      timestamp: 0,
      transactionHash: event.transactionHash,
      type: event.eventName === "RefundClaimed" ? "claim" : "claim",
      user: event.user
    };
  }

  return null;
}

export function activityFromProtocolEvent(event: ProbityProtocolEvent): ActivityFeedItem {
  if (event.eventName === "MarketCreated") {
    return {
      description: event.title,
      eventName: event.eventName,
      id: `${event.transactionHash}-${event.logIndex ?? 0}`,
      marketAddress: event.market,
      timestamp: new Date(0).toISOString(),
      title: "Market created",
      transactionHash: event.transactionHash
    };
  }

  if (event.eventName === "SharesPurchased") {
    return {
      actor: event.buyer,
      description: `${event.side} shares purchased`,
      eventName: event.eventName,
      id: `${event.transactionHash}-${event.logIndex ?? 0}`,
      marketAddress: event.market,
      timestamp: new Date(0).toISOString(),
      title: `Bought ${event.side}`,
      transactionHash: event.transactionHash
    };
  }

  if (event.eventName === "MarketResolved") {
    return {
      actor: event.resolver,
      description: `Resolved ${event.outcome} with resolver-submitted evidence: ${event.evidenceURI}`,
      eventName: event.eventName,
      id: `${event.transactionHash}-${event.logIndex ?? 0}`,
      marketAddress: event.market,
      timestamp: new Date(0).toISOString(),
      title: "Market resolved",
      transactionHash: event.transactionHash
    };
  }

  if (event.eventName === "MarketCancelled") {
    return {
      actor: event.canceller,
      description: "Market cancelled; remaining positions can claim refunds",
      eventName: event.eventName,
      id: `${event.transactionHash}-${event.logIndex ?? 0}`,
      marketAddress: event.market,
      timestamp: new Date(0).toISOString(),
      title: "Market cancelled",
      transactionHash: event.transactionHash
    };
  }

  if (event.eventName === "WinningsClaimed" || event.eventName === "RefundClaimed") {
    return {
      actor: event.user,
      description: event.eventName === "RefundClaimed" ? "Refund claimed" : "Payout claimed",
      eventName: event.eventName,
      id: `${event.transactionHash}-${event.logIndex ?? 0}`,
      marketAddress: event.market,
      timestamp: new Date(0).toISOString(),
      title: event.eventName === "RefundClaimed" ? "Claimed refund" : "Claimed winnings",
      transactionHash: event.transactionHash
    };
  }

  return {
    actor: event.account,
    description: event.approved ? "Approval enabled" : "Approval revoked",
    eventName: event.eventName,
    id: `${event.transactionHash}-${event.logIndex ?? 0}`,
    timestamp: new Date(0).toISOString(),
    title: event.eventName,
    transactionHash: event.transactionHash
  };
}

function inferCategory(title: string): MarketEntity["category"] {
  const value = title.toLowerCase();

  if (value.includes("btc") || value.includes("eth") || value.includes("crypto")) return "Crypto";
  if (value.includes("arc") || value.includes("stablecoin gas")) return "Arc";
  if (value.includes("bill") || value.includes("committee")) return "Policy";
  if (value.includes("earnings") || value.includes("revenue")) return "Earnings";
  if (value.includes("fed") || value.includes("ecb") || value.includes("rates")) return "Macro";

  return "Other";
}
