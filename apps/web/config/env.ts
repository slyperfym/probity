export const DEFAULT_LOCAL_CHAIN_ID = 31337;

function readPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  chainId: readPositiveInteger(process.env.NEXT_PUBLIC_CHAIN_ID, DEFAULT_LOCAL_CHAIN_ID),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  arcChainName: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? "Arc Testnet",
  arcNativeCurrencyName: process.env.NEXT_PUBLIC_ARC_NATIVE_CURRENCY_NAME ?? "Arc Gas",
  arcNativeCurrencySymbol: process.env.NEXT_PUBLIC_ARC_NATIVE_CURRENCY_SYMBOL ?? "ARC",
  arcBlockExplorerUrl: process.env.NEXT_PUBLIC_ARC_BLOCK_EXPLORER_URL ?? "",
  marketFactoryAddress: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ?? "",
  settlementTokenAddress: process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS ?? "",
  deploymentTarget: process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET ?? "local",
  marketDataMode: process.env.NEXT_PUBLIC_MARKET_DATA_MODE ?? "auto"
} as const;

export const hasWalletConnectProjectId = publicEnv.walletConnectProjectId.trim().length > 0;
