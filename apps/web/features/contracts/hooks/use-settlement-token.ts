"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import { getSettlementTokenConfig, hasContractAddress } from "@/config/contracts";
import { toOptionalAddress } from "@/lib/contracts";

const settlementTokenConfig = getSettlementTokenConfig();

export function useMockUsdcBalance(accountAddress: string | undefined) {
  const account = toOptionalAddress(accountAddress);
  const isConfigured = hasContractAddress("MockUSDC");

  return useReadContract({
    ...settlementTokenConfig,
    args: account ? [account] : undefined,
    functionName: "balanceOf",
    query: {
      enabled: isConfigured && Boolean(account),
      placeholderData: (previousData: unknown) => previousData,
      refetchInterval: 8_000,
      refetchIntervalInBackground: false
    }
  });
}

export function useMockUsdcAllowance({
  ownerAddress,
  spenderAddress
}: {
  ownerAddress: string | undefined;
  spenderAddress: string | undefined;
}) {
  const owner = toOptionalAddress(ownerAddress);
  const spender = toOptionalAddress(spenderAddress);
  const isConfigured = hasContractAddress("MockUSDC");

  return useReadContract({
    ...settlementTokenConfig,
    args: owner && spender ? [owner, spender] : undefined,
    functionName: "allowance",
    query: {
      enabled: isConfigured && Boolean(owner && spender),
      placeholderData: (previousData: unknown) => previousData,
      refetchInterval: 8_000,
      refetchIntervalInBackground: false
    }
  });
}

export function getMockUsdcWriteConfig() {
  return {
    ...settlementTokenConfig,
    address: settlementTokenConfig.address as Address
  } as const;
}
