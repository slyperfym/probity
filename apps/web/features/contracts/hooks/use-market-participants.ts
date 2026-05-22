"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem, type Address, type PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import { deploymentConfig } from "@/config/contracts";

const SHARES_PURCHASED_EVENT = parseAbiItem(
  "event SharesPurchased(address indexed buyer,uint8 indexed side,uint256 amount,uint256 shares,uint256 totalYesShares,uint256 totalNoShares)"
);
const YES_SOLD_EVENT = parseAbiItem(
  "event YesSold(address indexed user,uint256 shares,uint256 payout)"
);
const NO_SOLD_EVENT = parseAbiItem(
  "event NoSold(address indexed user,uint256 shares,uint256 payout)"
);

export function useMarketParticipantCounts(marketAddresses: readonly Address[], enabled: boolean) {
  const publicClient = usePublicClient();
  const normalizedAddresses = React.useMemo(
    () => marketAddresses.map((address) => address.toLowerCase()).sort(),
    [marketAddresses]
  );

  return useQuery({
    enabled: enabled && Boolean(publicClient) && marketAddresses.length > 0,
    queryFn: async () => {
      if (!publicClient) {
        return new Map<Address, number>();
      }

      const entries = await Promise.all(
        marketAddresses.map(async (address) => [
          address,
          await fetchMarketParticipantCount(publicClient, address)
        ] as const)
      );

      return new Map<Address, number>(entries);
    },
    queryKey: [
      "probity",
      "market-participants",
      deploymentConfig.chainId,
      deploymentConfig.deploymentBlock,
      normalizedAddresses.join(",")
    ],
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 20_000
  });
}

export function useMarketParticipantCount(marketAddress: Address | undefined, enabled = true) {
  const addresses = React.useMemo(() => (marketAddress ? [marketAddress] : []), [marketAddress]);
  const countsQuery = useMarketParticipantCounts(addresses, enabled && Boolean(marketAddress));

  return {
    ...countsQuery,
    data: marketAddress ? countsQuery.data?.get(marketAddress) ?? 0 : 0
  };
}

async function fetchMarketParticipantCount(publicClient: PublicClient, marketAddress: Address) {
  try {
    const [purchaseLogs, yesSoldLogs, noSoldLogs] = await Promise.all([
      publicClient.getLogs({
        address: marketAddress,
        event: SHARES_PURCHASED_EVENT,
        fromBlock: BigInt(deploymentConfig.deploymentBlock),
        toBlock: "latest"
      }),
      publicClient.getLogs({
        address: marketAddress,
        event: YES_SOLD_EVENT,
        fromBlock: BigInt(deploymentConfig.deploymentBlock),
        toBlock: "latest"
      }),
      publicClient.getLogs({
        address: marketAddress,
        event: NO_SOLD_EVENT,
        fromBlock: BigInt(deploymentConfig.deploymentBlock),
        toBlock: "latest"
      })
    ]);

    const participants = new Set<string>();

    for (const log of purchaseLogs) {
      const buyer = log.args.buyer;

      if (buyer) {
        participants.add(buyer.toLowerCase());
      }
    }

    for (const log of [...yesSoldLogs, ...noSoldLogs]) {
      const user = log.args.user;

      if (user) {
        participants.add(user.toLowerCase());
      }
    }

    return participants.size;
  } catch (error) {
    console.warn("Probity participant log read failed", {
      error,
      marketAddress
    });

    return 0;
  }
}
