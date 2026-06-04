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

// Arc testnet values are intentionally environment-driven until official public
// RPC, chain id, explorer, and gas-token metadata are selected for a deployment.
export const arcTestnetConfigured = defineChain({
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
    : undefined,
  contracts: publicEnv.deploymentTarget === "arc-testnet" ? {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0
    }
  } : undefined
});

export const probityChain = publicEnv.chainId === anvil.id ? anvil : arcTestnetConfigured;

export const supportedChains = [probityChain] as const;

export const supportedChainIds = supportedChains.map((chain) => chain.id);

export const isLocalChain = probityChain.id === anvil.id;
export const isArcTestnetTarget = publicEnv.deploymentTarget === "arc-testnet";
export const isMockTarget = publicEnv.deploymentTarget === "mock";
