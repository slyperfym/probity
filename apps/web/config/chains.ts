import { defineChain } from "viem";

import { DEFAULT_LOCAL_CHAIN_ID, publicEnv } from "@/config/env";

export const anvil = defineChain({
  id: DEFAULT_LOCAL_CHAIN_ID,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Anvil Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [publicEnv.rpcUrl]
    }
  }
});

export const arcConfigured = defineChain({
  id: publicEnv.chainId,
  name: publicEnv.arcChainName,
  nativeCurrency: {
    decimals: 18,
    name: publicEnv.arcNativeCurrencyName,
    symbol: publicEnv.arcNativeCurrencySymbol
  },
  rpcUrls: {
    default: {
      http: [publicEnv.rpcUrl]
    }
  },
  blockExplorers: publicEnv.arcBlockExplorerUrl
    ? {
        default: {
          name: `${publicEnv.arcChainName} Explorer`,
          url: publicEnv.arcBlockExplorerUrl
        }
      }
    : undefined
});

export const probityChain = publicEnv.chainId === anvil.id ? anvil : arcConfigured;

export const supportedChains = [probityChain] as const;

export const supportedChainIds = supportedChains.map((chain) => chain.id);

export const isLocalChain = probityChain.id === anvil.id;
