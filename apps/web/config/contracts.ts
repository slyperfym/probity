import type { Abi, Address } from "viem";
import { getAddress, isAddress, zeroAddress } from "viem";

import arcTestnetAddresses from "../../../deployments/arc-testnet/addresses.json";
import arcTestnetMarketFactoryAbi from "../../../deployments/arc-testnet/abis/MarketFactory.json";
import arcTestnetMockUsdcAbi from "../../../deployments/arc-testnet/abis/MockUSDC.json";
import arcTestnetPredictionMarketAbi from "../../../deployments/arc-testnet/abis/PredictionMarket.json";
import localAddresses from "../../../deployments/local/addresses.json";
import localMarketFactoryAbi from "../../../deployments/local/abis/MarketFactory.json";
import localMockUsdcAbi from "../../../deployments/local/abis/MockUSDC.json";
import localPredictionMarketAbi from "../../../deployments/local/abis/PredictionMarket.json";
import { publicEnv, type PublicDeploymentTarget } from "@/config/env";

type DeploymentTarget = PublicDeploymentTarget;
export type MarketDataMode = "auto" | "mock" | "contracts";

type DeploymentAddresses = {
  chainId: number;
  deploymentBlock: number;
  contracts: {
    MarketFactory?: string;
    SettlementToken?: string;
    MockUSDC?: string;
  };
  metadata?: {
    deployer?: string;
    resolver?: string;
    settlementTokenStrategy?: string;
    mode?: string;
  };
};

export type ProbityContractName = "MarketFactory" | "MockUSDC";

export type ProbityAddressMap = Record<ProbityContractName, Address | undefined>;

function getDeploymentTarget(): DeploymentTarget {
  return publicEnv.deploymentTarget;
}

function getMarketDataMode(): MarketDataMode {
  if (publicEnv.deploymentTarget === "mock") {
    return "mock";
  }

  if (publicEnv.marketDataMode === "mock" || publicEnv.marketDataMode === "contracts") {
    return publicEnv.marketDataMode;
  }

  return "auto";
}

const deploymentByTarget: Record<DeploymentTarget, DeploymentAddresses> = {
  "arc-testnet": arcTestnetAddresses,
  local: localAddresses,
  mock: {
    chainId: publicEnv.chainId,
    contracts: {},
    deploymentBlock: 0
  }
};

const abiByTarget = {
  "arc-testnet": {
    marketFactory: arcTestnetMarketFactoryAbi as Abi,
    mockUsdc: arcTestnetMockUsdcAbi as Abi,
    predictionMarket: arcTestnetPredictionMarketAbi as Abi
  },
  local: {
    marketFactory: localMarketFactoryAbi as Abi,
    mockUsdc: localMockUsdcAbi as Abi,
    predictionMarket: localPredictionMarketAbi as Abi
  },
  mock: {
    marketFactory: localMarketFactoryAbi as Abi,
    mockUsdc: localMockUsdcAbi as Abi,
    predictionMarket: localPredictionMarketAbi as Abi
  }
} satisfies Record<
  DeploymentTarget,
  {
    marketFactory: Abi;
    mockUsdc: Abi;
    predictionMarket: Abi;
  }
>;

function normalizeAddress(value: string | undefined): Address | undefined {
  if (!value || !isAddress(value)) {
    return undefined;
  }

  return getAddress(value);
}

const activeDeploymentTarget = getDeploymentTarget();
const activeDeployment = deploymentByTarget[activeDeploymentTarget];
const activeAbis = abiByTarget[activeDeploymentTarget];

export const contractAbis = {
  marketFactory: activeAbis.marketFactory,
  mockUsdc: activeAbis.mockUsdc,
  predictionMarket: activeAbis.predictionMarket
} as const;

export const contractAddresses: ProbityAddressMap = {
  MarketFactory:
    normalizeAddress(publicEnv.marketFactoryAddress) ??
    normalizeAddress(activeDeployment.contracts.MarketFactory),
  MockUSDC:
    normalizeAddress(publicEnv.settlementTokenAddress) ??
    normalizeAddress(activeDeployment.contracts.SettlementToken) ??
    normalizeAddress(activeDeployment.contracts.MockUSDC)
};

export const deploymentConfig = {
  chainId: activeDeployment.chainId,
  deploymentBlock: activeDeployment.deploymentBlock,
  deployerAddress: normalizeAddress(activeDeployment.metadata?.deployer),
  hasMarketFactory: Boolean(contractAddresses.MarketFactory),
  hasSettlementToken: Boolean(contractAddresses.MockUSDC),
  isArcTestnet: activeDeploymentTarget === "arc-testnet",
  isMockFallbackEnabled: publicEnv.enableMockMarkets,
  isMockOnly: getMarketDataMode() === "mock",
  marketDataMode: getMarketDataMode(),
  resolverAddress: normalizeAddress(activeDeployment.metadata?.resolver),
  target: activeDeploymentTarget
} as const;

export function hasContractAddress(name: ProbityContractName) {
  return Boolean(contractAddresses[name]);
}

export function getMarketFactoryConfig() {
  return {
    abi: contractAbis.marketFactory,
    address: contractAddresses.MarketFactory ?? zeroAddress
  } as const;
}

export function getSettlementTokenConfig() {
  return {
    abi: contractAbis.mockUsdc,
    address: contractAddresses.MockUSDC ?? zeroAddress
  } as const;
}

export function getPredictionMarketConfig(address: Address | undefined) {
  return {
    abi: contractAbis.predictionMarket,
    address: address ?? zeroAddress
  } as const;
}
