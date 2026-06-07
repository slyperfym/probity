"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Abi, AbiEvent, Address, PublicClient } from "viem";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";

import { contractAbis, deploymentConfig } from "@/config/contracts";

const TRADE_EVENT_CONFIG: Record<string, readonly string[]> = {
  NoBought: ["buyer", "user", "trader"],
  NoSold: ["user", "seller", "trader"],
  SharesPurchased: ["buyer", "user", "trader"],
  SharesSold: ["seller", "user", "trader"],
  YesBought: ["buyer", "user", "trader"],
  YesSold: ["user", "seller", "trader"]
};

type ParticipantEvent = {
  event: AbiEvent;
  eventName: string;
  participantArgNames: readonly string[];
};

type ParticipantLogSummary = {
  eventName: string;
  logCount: number;
};

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
        devWarn("Participant count public client is unavailable.");
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
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000
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
  if (!isAddress(marketAddress)) {
    devWarn("Participant count received an invalid market address.", { marketAddress });
    return 0;
  }

  const participantEvents = getParticipantEvents(contractAbis.predictionMarket);

  if (participantEvents.length === 0) {
    devWarn("PredictionMarket ABI has no supported participant trade events.", {
      configuredEventNames: Object.keys(TRADE_EVENT_CONFIG)
    });
    return 0;
  }

  const configuredFromBlock = BigInt(Math.max(deploymentConfig.deploymentBlock, 0));
  const configuredResult = await readParticipantsFromBlock({
    fromBlock: configuredFromBlock,
    marketAddress,
    participantEvents,
    publicClient
  });

  if (configuredResult.participantCount > 0 || configuredFromBlock === 0n) {
    devLogParticipantSummary(marketAddress, configuredFromBlock, configuredResult);
    return configuredResult.participantCount;
  }

  const genesisResult = await readParticipantsFromBlock({
    fromBlock: 0n,
    marketAddress,
    participantEvents,
    publicClient
  });

  devLogParticipantSummary(marketAddress, 0n, genesisResult, {
    retriedFromGenesis: true,
    zeroLogsFromConfiguredBlock: configuredFromBlock.toString()
  });

  return genesisResult.participantCount;
}

async function readParticipantsFromBlock({
  fromBlock,
  marketAddress,
  participantEvents,
  publicClient
}: {
  fromBlock: bigint;
  marketAddress: Address;
  participantEvents: readonly ParticipantEvent[];
  publicClient: PublicClient;
}) {
  const participants = new Set<string>();
  const summaries: ParticipantLogSummary[] = [];
  const eventResults = await Promise.all(
    participantEvents.map(async (participantEvent) => {
      try {
        const logs = await publicClient.getLogs({
          address: marketAddress,
          event: participantEvent.event,
          fromBlock,
          toBlock: "latest"
        });

        return {
          logs,
          participantEvent
        };
      } catch (error) {
        devWarn("Participant getLogs failed.", {
          error,
          eventName: participantEvent.eventName,
          fromBlock: fromBlock.toString(),
          marketAddress
        });

        return {
          logs: [],
          participantEvent
        };
      }
    })
  );

  for (const { logs, participantEvent } of eventResults) {
    summaries.push({
      eventName: participantEvent.eventName,
      logCount: logs.length
    });

    for (const log of logs) {
      const participant = extractParticipantAddress(log.args, participantEvent);

      if (participant) {
        participants.add(participant.toLowerCase());
      } else {
        devWarn("Unable to extract participant address from trade log.", {
          args: log.args,
          eventName: participantEvent.eventName,
          marketAddress
        });
      }
    }
  }

  return {
    participantCount: participants.size,
    summaries
  };
}

function getParticipantEvents(abi: Abi): ParticipantEvent[] {
  return abi.flatMap((item) => {
    if (item.type !== "event" || !item.name) {
      return [];
    }

    const participantArgNames = TRADE_EVENT_CONFIG[item.name];

    if (!participantArgNames) {
      return [];
    }

    const hasKnownParticipantArg = item.inputs.some((input) =>
      participantArgNames.includes(input.name ?? "")
    );

    if (!hasKnownParticipantArg) {
      devWarn("Participant event is present but missing a known participant argument.", {
        eventName: item.name,
        expectedArgs: participantArgNames,
        inputs: item.inputs.map((input) => input.name)
      });
      return [];
    }

    return [
      {
        event: item as AbiEvent,
        eventName: item.name,
        participantArgNames
      }
    ];
  });
}

function extractParticipantAddress(
  args: Record<string, unknown> | readonly unknown[] | undefined,
  participantEvent: ParticipantEvent
) {
  if (!args || Array.isArray(args)) {
    return undefined;
  }

  const namedArgs = args as Record<string, unknown>;

  for (const argName of participantEvent.participantArgNames) {
    const value = namedArgs[argName];

    if (typeof value === "string" && isAddress(value)) {
      return value;
    }
  }

  return undefined;
}

function devLogParticipantSummary(
  marketAddress: Address,
  fromBlock: bigint,
  result: { participantCount: number; summaries: readonly ParticipantLogSummary[] },
  extra?: Record<string, string | boolean>
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const eventCounts = Object.fromEntries(
    result.summaries.map((summary) => [summary.eventName, summary.logCount])
  );

  console.info(`participant logs for market ${marketAddress}`, {
    ...extra,
    eventCounts,
    fromBlock: fromBlock.toString(),
    uniqueParticipants: result.participantCount
  });
}

function devWarn(message: string, metadata?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(message, metadata);
}
