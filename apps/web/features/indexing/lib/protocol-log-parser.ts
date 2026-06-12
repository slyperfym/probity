"use client";

import type {
  HexAddress,
  IndexedBlockRef,
  ProbityProtocolEvent
} from "@probity/types";
import { decodeEventLog, type Abi, type Address, type Hex, type Log } from "viem";

import { contractAbis } from "@/config/contracts";

type KnownContract = "MarketFactory" | "PredictionMarket";
type DecodedProtocolLog = {
  args: unknown;
  eventName: string;
};

export type ParseableProtocolLog = Log<bigint, number, false> & {
  address: Address;
};

export function parseProbityLogs({
  chainId,
  logs,
  source
}: {
  chainId: number;
  logs: ParseableProtocolLog[];
  source: KnownContract;
}) {
  return logs
    .map((log) => parseProbityLog({ chainId, log, source }))
    .filter((event): event is ProbityProtocolEvent => Boolean(event));
}

export function parseProbityLog({
  chainId,
  log,
  source
}: {
  chainId: number;
  log: ParseableProtocolLog;
  source: KnownContract;
}): ProbityProtocolEvent | null {
  const abi = source === "MarketFactory" ? contractAbis.marketFactory : contractAbis.predictionMarket;

  try {
    const decoded = decodeEventLog({
      abi: abi as Abi,
      data: log.data,
      topics: log.topics
    });
    const blockRef = toBlockRef(chainId, log);
    const protocolLog = decoded as unknown as DecodedProtocolLog;

    if (source === "MarketFactory") {
      return parseFactoryEvent(protocolLog, blockRef);
    }

    return parsePredictionMarketEvent(protocolLog, blockRef, log.address);
  } catch {
    return null;
  }
}

function parseFactoryEvent(
  decoded: DecodedProtocolLog,
  blockRef: IndexedBlockRef
): ProbityProtocolEvent | null {
  if (decoded.eventName === "MarketCreated") {
    const args = decoded.args as unknown as {
      creator: Address;
      expirationTime: bigint;
      market: Address;
      metadataURI: string;
      resolver: Address;
      settlementToken: Address;
      title: string;
    };

    return {
      ...blockRef,
      creator: args.creator,
      eventName: "MarketCreated",
      expirationTime: args.expirationTime,
      market: args.market,
      metadataURI: args.metadataURI,
      resolver: args.resolver,
      settlementToken: args.settlementToken,
      title: args.title
    };
  }

  if (decoded.eventName === "ResolverApprovalUpdated" || decoded.eventName === "CreatorApprovalUpdated") {
    const args = decoded.args as unknown as {
      approved: boolean;
      creator?: Address;
      resolver?: Address;
    };

    return {
      ...blockRef,
      account: (args.resolver ?? args.creator) as HexAddress,
      approved: args.approved,
      eventName: decoded.eventName
    };
  }

  return null;
}

function parsePredictionMarketEvent(
  decoded: DecodedProtocolLog,
  blockRef: IndexedBlockRef,
  market: Address
): ProbityProtocolEvent | null {
  if (decoded.eventName === "SharesPurchased") {
    const args = decoded.args as unknown as {
      amount: bigint;
      buyer: Address;
      shares: bigint;
      side: number;
      totalNoShares: bigint;
      totalYesShares: bigint;
    };

    return {
      ...blockRef,
      amount: args.amount,
      buyer: args.buyer,
      eventName: "SharesPurchased",
      market,
      shares: args.shares,
      side: args.side === 0 ? "YES" : "NO",
      totalNoShares: args.totalNoShares,
      totalYesShares: args.totalYesShares
    };
  }

  if (decoded.eventName === "MarketResolved") {
    const args = decoded.args as unknown as {
      outcome: number;
      resolver: Address;
      totalDeposited: bigint;
    };

    return {
      ...blockRef,
      eventName: "MarketResolved",
      market,
      outcome: args.outcome === 1 ? "YES" : "NO",
      resolver: args.resolver,
      totalDeposited: args.totalDeposited
    };
  }

  if (decoded.eventName === "MarketCancelled") {
    const args = decoded.args as unknown as {
      canceller: Address;
    };

    return {
      ...blockRef,
      canceller: args.canceller,
      eventName: "MarketCancelled",
      market
    };
  }

  if (decoded.eventName === "WinningsClaimed") {
    const args = decoded.args as unknown as {
      amount: bigint;
      user: Address;
    };

    return {
      ...blockRef,
      amount: args.amount,
      eventName: "WinningsClaimed",
      market,
      user: args.user
    };
  }

  if (decoded.eventName === "RefundClaimed") {
    const args = decoded.args as unknown as {
      amount: bigint;
      user: Address;
    };

    return {
      ...blockRef,
      amount: args.amount,
      eventName: "RefundClaimed",
      market,
      user: args.user
    };
  }

  return null;
}

function toBlockRef(chainId: number, log: ParseableProtocolLog): IndexedBlockRef {
  return {
    blockHash: log.blockHash as Hex | undefined,
    blockNumber: log.blockNumber ?? 0n,
    chainId,
    logIndex: log.logIndex,
    network: chainId === 31337 ? "local" : "unknown",
    transactionHash: (log.transactionHash ?? "0x") as Hex,
    transactionIndex: log.transactionIndex
  };
}
