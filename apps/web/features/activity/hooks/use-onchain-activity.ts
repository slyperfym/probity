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

  return useQuery({
    enabled: enabled && Boolean(publicClient && wallet && normalizedMarkets.length > 0),
    queryFn: async () => {
      if (!publicClient || !wallet) return [];

      const activity = await fetchWalletActivity({
        markets: normalizedMarkets,
        publicClient,
        wallet
      });

      return sortNewestFirst(activity);
    },
    queryKey: [
      "probity",
      "wallet-onchain-activity",
      deploymentConfig.chainId,
      wallet,
      normalizedMarkets.map((market) => market.address.toLowerCase()).join(",")
    ],
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 10_000
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

  return useQuery({
    enabled: enabled && Boolean(publicClient && market),
    queryFn: async () => {
      if (!publicClient || !market) return [];

      const activity = await fetchMarketActivity({
        market,
        marketTitle,
        publicClient
      });

      return sortNewestFirst(activity);
    },
    queryKey: [
      "probity",
      "market-onchain-activity",
      deploymentConfig.chainId,
      market,
      marketTitle
    ],
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 10_000
  });
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
      const [buyLogs, yesSoldLogs, noSoldLogs, claimLogs, resolveLogs] = await Promise.all([
        publicClient.getLogs({
          address: market.address,
          args: { buyer: wallet },
          event: sharesPurchasedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }),
        publicClient.getLogs({
          address: market.address,
          args: { user: wallet },
          event: yesSoldEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }),
        publicClient.getLogs({
          address: market.address,
          args: { user: wallet },
          event: noSoldEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }),
        publicClient.getLogs({
          address: market.address,
          args: { user: wallet },
          event: winningsClaimedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        }),
        publicClient.getLogs({
          address: market.address,
          event: marketResolvedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        })
      ]);

      const userTouchedMarket =
        buyLogs.length > 0 || yesSoldLogs.length > 0 || noSoldLogs.length > 0 || claimLogs.length > 0;

      return [
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
        ...(userTouchedMarket
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
      ];
    })
  );

  return entries.flat();
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
  const [creationLogs, buyLogs, yesSoldLogs, noSoldLogs, claimLogs, resolveLogs] = await Promise.all([
    contractAddresses.MarketFactory
      ? publicClient.getLogs({
          address: contractAddresses.MarketFactory,
          args: { market },
          event: marketCreatedEvent,
          fromBlock: fromBlock(),
          toBlock: "latest"
        })
      : Promise.resolve([]),
    publicClient.getLogs({
      address: market,
      event: sharesPurchasedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }),
    publicClient.getLogs({
      address: market,
      event: yesSoldEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }),
    publicClient.getLogs({
      address: market,
      event: noSoldEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }),
    publicClient.getLogs({
      address: market,
      event: winningsClaimedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    }),
    publicClient.getLogs({
      address: market,
      event: marketResolvedEvent,
      fromBlock: fromBlock(),
      toBlock: "latest"
    })
  ]);

  return [
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
}

function fromBlock() {
  return BigInt(Math.max(deploymentConfig.deploymentBlock, 0));
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
