export const DEFAULT_LOCAL_CHAIN_ID = 31337;
export const ARC_TESTNET_CHAIN_ID = 5042002;
export type PublicDeploymentTarget = "local" | "arc-testnet" | "mock";

function readPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const deploymentTarget = readDeploymentTarget(process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET);
const isArcTestnetTarget = deploymentTarget === "arc-testnet";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  chainId: readPositiveInteger(
    process.env.NEXT_PUBLIC_CHAIN_ID,
    isArcTestnetTarget ? ARC_TESTNET_CHAIN_ID : DEFAULT_LOCAL_CHAIN_ID
  ),
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL ??
    (isArcTestnetTarget ? "https://rpc.testnet.arc.network" : "http://127.0.0.1:8545"),
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  arcChainName: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? "Arc Testnet",
  arcNativeCurrencyName: process.env.NEXT_PUBLIC_ARC_NATIVE_CURRENCY_NAME ?? "USD Coin",
  arcNativeCurrencySymbol: process.env.NEXT_PUBLIC_ARC_NATIVE_CURRENCY_SYMBOL ?? "USDC",
  arcBlockExplorerUrl:
    process.env.NEXT_PUBLIC_ARC_BLOCK_EXPLORER_URL ??
    (isArcTestnetTarget ? "https://testnet.arcscan.app" : ""),
  marketFactoryAddress: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ?? "",
  settlementTokenAddress: process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS ?? "",
  deploymentTarget,
  marketDataMode: process.env.NEXT_PUBLIC_MARKET_DATA_MODE ?? "auto"
} as const;

export const hasWalletConnectProjectId = publicEnv.walletConnectProjectId.trim().length > 0;

function readDeploymentTarget(value: string | undefined): PublicDeploymentTarget {
  if (value === "arc-testnet" || value === "mock") {
    return value;
  }

  return "local";
}
