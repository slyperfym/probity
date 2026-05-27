import { AlertTriangle } from "lucide-react";

import { isArcTestnetTarget, isMockTarget } from "@/config/chains";
import { deploymentConfig } from "@/config/contracts";
import { publicEnv } from "@/config/env";

const ARC_TESTNET_ONCHAIN_LABEL = "Arc Testnet onchain";

export function DeploymentReadinessAlert() {
  const message = getDeploymentMessage();

  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-cyan-400/20 bg-cyan-400/10">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2 text-xs text-cyan-100 sm:px-6 sm:text-sm lg:px-8">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-cyan-300 sm:h-4 sm:w-4" />
        <p className="truncate leading-5">{message}</p>
      </div>
    </div>
  );
}

function getDeploymentMessage() {
  if (isMockTarget) {
    return "Contract reads and wallet writes are disabled for this environment.";
  }

  if (isArcTestnetTarget) {
    if (!publicEnv.rpcUrl || publicEnv.rpcUrl.includes("127.0.0.1")) {
      return "Arc testnet target selected, but the RPC URL is still local or empty. Configure a reachable Arc testnet RPC before testing wallets.";
    }

    if (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken) {
      return "Arc testnet configuration is ready. MarketFactory and settlement token addresses must be configured before live markets can load.";
    }

    return ARC_TESTNET_ONCHAIN_LABEL;
  }

  return null;
}
