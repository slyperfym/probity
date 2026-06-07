"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAddress,
  isAddress,
  parseAbiItem,
  type Address,
  type PublicClient
} from "viem";
import { usePublicClient } from "wagmi";

import { contractAddresses, deploymentConfig } from "@/config/contracts";
import type { OnchainActivityItem } from "@/features/activity/types";

const USDC_DECIMALS = 1_000_000n;
const ACTIVITY_TIMEOUT_MS = 5_500;
const ACTIVITY_CACHE_TTL_MS = 15 * 60_000;

const sharesPurchasedEvent = parseAbiItem(
  "event SharesPurchased(address indexed buyer, uint8 indexed side, uint256 amount, uint256 shares, uint256 totalYesShares, uint256 totalNoShares)"
);
const yesSoldEvent = parseAbiItem(
  "event YesSold(address indexed user, uint256 shares, uint256 payout)"
);
const noSoldEvent = parseAbiItem(
  "event NoSold(address indexed user, uint256 shares, uint256 payout)"
);
const winningsClaimedEvent = parseAbiItem(
  "event WinningsClaimed(address indexed user, uint256 amount)"
);
const marketResolvedEvent = parseAbiItem(
  "event MarketResolved(address indexed resolver, uint8 indexed outcome, uint256 totalDeposited)"
);
const marketCreatedEvent = parseAbiItem(
  "event MarketCreated(address indexed market, address indexed creator, address indexed settlementToken, address resolver, uint256 expirationTime, string title, string metadataURI)"
);

export type ActivityMarketRef = {
  address: `0x${string}`;
  title: string;
};

export function useWalletOnchainActivity({
  enabled = true,
  markets,
  walletAddress
}: {
  enabled?: boolean;
  markets: ActivityMarketRef[];
  walletAddress: string | undefined;
}) {
  const publicClient = usePublicClient();
  const wallet = toAddress(walletAddress);
  const normalizedMarkets = React.useMemo(
    () => markets.filter((market) => isAddress(market.address)),
    [markets]
  );
  const queryKey = [
    "probity",
    "wallet-onchain-activity",
    deploymentConfig.chainId,
    wallet,
    normalizedMarkets.map((market) => market.address.toLowerCase()).join(",")
  ];
  const cacheKey = queryKey.join(":");
  const cachedActivity = readCachedActivity(cacheKey);

  return useQuery({
    enabled: enabled && Boolean(publicClient && wallet && normalizedMarkets.length > 0),
    initialData: cachedActivity?.items,
    initialDataUpdatedAt: cachedActivity?.cachedAt,
    queryFn: async () => {
      if (!publicClient || !wallet) return [];

      const activity = await withActivityTimeout(
        fetchWalletActivity({
          markets: normalizedMarkets,
          publicClient,
          wallet
        })
      );

      const sortedActivity = sortNewestFirst(activity);

      writeCachedActivity(cacheKey, sortedActivity);

      return sortedActivity;
    },
    queryKey,
    retry: false,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000
  });
}

export function useMarketOnchainActivity({
  enabled = true,
  marketAddress,
  marketTitle
}: {
  enabled?: boolean;
  marketAddress: string | undefined;
  marketTitle: string;
}) {
  const publicClient = usePublicClient();
  const market = toAddress(marketAddress);
  const queryKey = [
    "probity",
    "market-onchain-activity",
    deploymentConfig.chainId,
    market,
    marketTitle
  ];
  const cacheKey = queryKey.join(":");
  const cachedActivity = readCachedActivity(cacheKey);

  return useQuery({
    enabled: enabled && Boolean(publicClient && market),
    initialData: cachedActivity?.items,
    initialDataUpdatedAt: cachedActivity?.cachedAt,
    queryFn: async () => {
      if (!publicClient || !market) return [];

      const activity = await withActivityTimeout(
        fetchMarketActivity({
          market,
          marketTitle,
          publicClient
        })
      );

      const sortedActivity = sortNewestFirst(activity);

      writeCachedActivity(cacheKey, sortedActivity);

      return sortedActivity;
    },
    queryKey,
    retry: false,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000
  });
}

async function withActivityTimeout<T>(work: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Activity indexing is being improved."));
    }, ACTIVITY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function fetchWalletActivity({
  markets,
  publicClient,
  wallet
}: {
  markets: ActivityMarketRef[];
  publicClient: PublicClient;
  wallet: Address;
}) {
  const entries = await Promise.all(
    markets.map(async (market) => {
      const results = await Promise.all([
        getLogsResult(() => publicClient.getLogs({
          address: market.address,
          event: sharesPurchasedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "wallet SharesPurchased", market.address),
        getLogsResult(() => publicClient.getLogs({
          address: market.address,
          event: yesSoldEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "wallet YesSold", market.address),
        getLogsResult(() => publicClient.getLogs({
          address: market.address,
          event: noSoldEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "wallet NoSold", market.address),
        getLogsResult(() => publicClient.getLogs({
          address: market.address,
          event: winningsClaimedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "wallet WinningsClaimed", market.address),
        getLogsResult(() => publicClient.getLogs({
          address: market.address,
          event: marketResolvedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "wallet MarketResolved", market.address),
        contractAddresses.MarketFactory
          ? getLogsResult(() => publicClient.getLogs({
              address: contractAddresses.MarketFactory,
              args: { market: market.address },
              event: marketCreatedEvent,
              fromBlock: fromBlock(),
              toBlock: "latest"
            }), "wallet MarketCreated", market.address)
          : Promise.resolve(emptyLogsResult())
      ]);
      const [buyResult, yesSoldResult, noSoldResult, claimResult, resolveResult, creationResult] =
        results;
      const buyLogs = buyResult.logs.filter((log) => sameAddress(log.args.buyer, wallet));
      const yesSoldLogs = yesSoldResult.logs.filter((log) => sameAddress(log.args.user, wallet));
      const noSoldLogs = noSoldResult.logs.filter((log) => sameAddress(log.args.user, wallet));
      const claimLogs = claimResult.logs.filter((log) => sameAddress(log.args.user, wallet));
      const resolveLogs = resolveResult.logs;
      const creationLogsRaw = creationResult.logs as Array<{
        args: { creator?: string; title?: string };
        blockNumber?: bigint;
        logIndex: number;
        transactionHash: string;
      }>;
      const creationLogs = creationLogsRaw.filter((log) =>
        sameAddress(log.args.creator, wallet)
      );

      const userTouchedMarket =
        buyLogs.length > 0 ||
        yesSoldLogs.length > 0 ||
        noSoldLogs.length > 0 ||
        claimLogs.length > 0 ||
        creationLogs.length > 0;

      return {
        failed: results.some((result) => result.failed),
        items: [
          ...creationLogs.map((log) => ({
            action: "Created market",
            amountLabel: "PredictionMarket deployed",
            blockNumber: log.blockNumber ?? 0n,
            id: `${log.transactionHash}-${log.logIndex}`,
            kind: "create" as const,
            marketAddress: market.address,
            marketTitle: log.args.title || market.title,
            status: "confirmed" as const,
            transactionHash: log.transactionHash as `0x${string}`
          })),
          ...buyLogs.map((log) => ({
            action: `Bought ${Number(log.args.side) === 0 ? "YES" : "NO"}`,
            amountLabel: formatUsdc(log.args.amount),
            blockNumber: log.blockNumber ?? 0n,
            id: `${log.transactionHash}-${log.logIndex}`,
            kind: "buy" as const,
            marketAddress: market.address,
            marketTitle: market.title,
            status: "confirmed" as const,
            transactionHash: log.transactionHash as `0x${string}`
          })),
          ...yesSoldLogs.map((log) => ({
            action: "Sold YES",
            amountLabel: `${formatUsdc(log.args.shares)} shares / ${formatUsdc(log.args.payout)} USDC`,
            blockNumber: log.blockNumber ?? 0n,
            id: `${log.transactionHash}-${log.logIndex}`,
            kind: "sell" as const,
            marketAddress: market.address,
            marketTitle: market.title,
            status: "confirmed" as const,
            transactionHash: log.transactionHash as `0x${string}`
          })),
          ...noSoldLogs.map((log) => ({
            action: "Sold NO",
            amountLabel: `${formatUsdc(log.args.shares)} shares / ${formatUsdc(log.args.payout)} USDC`,
            blockNumber: log.blockNumber ?? 0n,
            id: `${log.transactionHash}-${log.logIndex}`,
            kind: "sell" as const,
            marketAddress: market.address,
            marketTitle: market.title,
            status: "confirmed" as const,
            transactionHash: log.transactionHash as `0x${string}`
          })),
          ...claimLogs.map((log) => ({
            action: "Claimed payout",
            amountLabel: `${formatUsdc(log.args.amount)} USDC`,
            blockNumber: log.blockNumber ?? 0n,
            id: `${log.transactionHash}-${log.logIndex}`,
            kind: "claim" as const,
            marketAddress: market.address,
            marketTitle: market.title,
            status: "confirmed" as const,
            transactionHash: log.transactionHash as `0x${string}`
          })),
          ...(userTouchedMarket ||
          resolveLogs.some((log) => sameAddress(log.args.resolver, wallet))
            ? resolveLogs.map((log) => ({
                action: `Market resolved ${Number(log.args.outcome) === 1 ? "YES" : "NO"}`,
                amountLabel: `${formatUsdc(log.args.totalDeposited)} USDC deposited`,
                blockNumber: log.blockNumber ?? 0n,
                id: `${log.transactionHash}-${log.logIndex}`,
                kind: "resolve" as const,
                marketAddress: market.address,
                marketTitle: market.title,
                status: "confirmed" as const,
                transactionHash: log.transactionHash as `0x${string}`
              }))
            : [])
        ]
      };
    })
  );

  const failedMarkets = entries.filter((entry) => entry.failed).length;
  const activity = entries.flatMap((entry) => entry.items);
  logActivityDebug("wallet activity", {
    connectedWallet: wallet,
    failedMarkets,
    logsFound: activity.length,
    marketsScanned: markets.length
  });

  if (failedMarkets > 0 && activity.length === 0) {
    throw new Error("Activity indexing is being improved.");
  }

  return activity;
}

async function fetchMarketActivity({
  market,
  marketTitle,
  publicClient
}: {
  market: Address;
  marketTitle: string;
  publicClient: PublicClient;
}) {
  const results = await Promise.all([
    contractAddresses.MarketFactory
      ? getLogsResult(() => publicClient.getLogs({
          address: contractAddresses.MarketFactory,
          args: { market },
          event: marketCreatedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }), "market MarketCreated", market)
      : Promise.resolve(emptyLogsResult()),
    getLogsResult(() => publicClient.getLogs({
      address: market,
      event: sharesPurchasedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }), "market SharesPurchased", market),
    getLogsResult(() => publicClient.getLogs({
      address: market,
      event: yesSoldEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }), "market YesSold", market),
    getLogsResult(() => publicClient.getLogs({
      address: market,
      event: noSoldEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }), "market NoSold", market),
    getLogsResult(() => publicClient.getLogs({
      address: market,
      event: winningsClaimedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }), "market WinningsClaimed", market),
    getLogsResult(() => publicClient.getLogs({
      address: market,
      event: marketResolvedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }), "market MarketResolved", market)
  ]);
  const [creationResult, buyResult, yesSoldResult, noSoldResult, claimResult, resolveResult] =
    results;
  const creationLogs = creationResult.logs as Array<{
    args: { title?: string };
    blockNumber?: bigint;
    logIndex: number;
    transactionHash: string;
  }>;
  const buyLogs = buyResult.logs;
  const yesSoldLogs = yesSoldResult.logs;
  const noSoldLogs = noSoldResult.logs;
  const claimLogs = claimResult.logs;
  const resolveLogs = resolveResult.logs;

  const activity = [
    ...creationLogs.map((log) => ({
      action: "Market created",
      amountLabel: "PredictionMarket deployed",
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "create" as const,
      marketAddress: market,
      marketTitle: log.args.title || marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    })),
    ...buyLogs.map((log) => ({
      action: `Bought ${Number(log.args.side) === 0 ? "YES" : "NO"}`,
      amountLabel: formatUsdc(log.args.amount),
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "buy" as const,
      marketAddress: market,
      marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    })),
    ...yesSoldLogs.map((log) => ({
      action: "Sold YES",
      amountLabel: `${formatUsdc(log.args.shares)} shares / ${formatUsdc(log.args.payout)} USDC`,
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "sell" as const,
      marketAddress: market,
      marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    })),
    ...noSoldLogs.map((log) => ({
      action: "Sold NO",
      amountLabel: `${formatUsdc(log.args.shares)} shares / ${formatUsdc(log.args.payout)} USDC`,
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "sell" as const,
      marketAddress: market,
      marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    })),
    ...resolveLogs.map((log) => ({
      action: `Market resolved ${Number(log.args.outcome) === 1 ? "YES" : "NO"}`,
      amountLabel: `${formatUsdc(log.args.totalDeposited)} USDC deposited`,
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "resolve" as const,
      marketAddress: market,
      marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    })),
    ...claimLogs.map((log) => ({
      action: "Claimed payout",
      amountLabel: `${formatUsdc(log.args.amount)} USDC`,
      blockNumber: log.blockNumber ?? 0n,
      id: `${log.transactionHash}-${log.logIndex}`,
      kind: "claim" as const,
      marketAddress: market,
      marketTitle,
      status: "confirmed" as const,
      transactionHash: log.transactionHash as `0x${string}`
    }))
  ];

  logActivityDebug("market activity", {
    failedReads: results.filter((result) => result.failed).length,
    logsFound: activity.length,
    market
  });

  if (results.some((result) => result.failed) && activity.length === 0) {
    throw new Error("Activity indexing is being improved.");
  }

  return activity;
}

function fromBlock() {
  return BigInt(Math.max(0, deploymentConfig.deploymentBlock));
}

function sortNewestFirst(items: OnchainActivityItem[]) {
  return [...items].sort((left, right) => {
    if (left.blockNumber === right.blockNumber) return 0;
    return left.blockNumber > right.blockNumber ? -1 : 1;
  });
}

function toAddress(value: string | undefined) {
  return value && isAddress(value) ? getAddress(value) : undefined;
}

function formatUsdc(value: bigint | undefined) {
  const amount = Number((value ?? 0n) * 100n / USDC_DECIMALS) / 100;

  return amount.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function sameAddress(left: string | undefined, right: Address) {
  return Boolean(left && isAddress(left) && getAddress(left) === right);
}

type LogReadResult<T> = {
  failed: boolean;
  logs: T[];
};

async function getLogsResult<T>(
  readLogs: () => Promise<T[]>,
  label: string,
  marketAddress: Address
): Promise<LogReadResult<T>> {
  try {
    return {
      failed: false,
      logs: await readLogs()
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Probity onchain activity log read failed", {
        error,
        label,
        marketAddress
      });
    }

    return {
      failed: true,
      logs: []
    };
  }
}

function emptyLogsResult<T>(): LogReadResult<T> {
  return {
    failed: false,
    logs: []
  };
}

function logActivityDebug(label: string, values: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`Probity ${label}`, values);
}

type CachedActivityEntry = {
  cachedAt: number;
  items: OnchainActivityItem[];
};

type SerializedActivityItem = Omit<OnchainActivityItem, "blockNumber"> & {
  blockNumber: string;
};

function readCachedActivity(cacheKey: string): CachedActivityEntry | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawValue = window.localStorage.getItem(getActivityStorageKey(cacheKey));

    if (!rawValue) {
      return undefined;
    }

    const parsed = JSON.parse(rawValue) as {
      cachedAt?: number;
      items?: SerializedActivityItem[];
    };

    if (!parsed.cachedAt || !parsed.items || Date.now() - parsed.cachedAt > ACTIVITY_CACHE_TTL_MS) {
      window.localStorage.removeItem(getActivityStorageKey(cacheKey));
      return undefined;
    }

    return {
      cachedAt: parsed.cachedAt,
      items: parsed.items.map((item) => ({
        ...item,
        blockNumber: BigInt(item.blockNumber)
      }))
    };
  } catch {
    window.localStorage.removeItem(getActivityStorageKey(cacheKey));
    return undefined;
  }
}

function writeCachedActivity(cacheKey: string, items: OnchainActivityItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const serializedItems: SerializedActivityItem[] = items.map((item) => ({
    ...item,
    blockNumber: item.blockNumber.toString()
  }));

  window.localStorage.setItem(
    getActivityStorageKey(cacheKey),
    JSON.stringify({
      cachedAt: Date.now(),
      items: serializedItems
    })
  );
}

function getActivityStorageKey(cacheKey: string) {
  return `probity-onchain-activity:${cacheKey}`;
}
