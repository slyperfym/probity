import { AlertTriangle } from "lucide-react";

import { isArcTestnetTarget, isMockTarget, probityChain } from "@/config/chains";
import { deploymentConfig } from "@/config/contracts";
import { publicEnv } from "@/config/env";

export function DeploymentReadinessAlert() {
  const message = getDeploymentMessage();

  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-cyan-400/20 bg-cyan-400/10">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 py-3 text-sm text-cyan-100 sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
        <p className="leading-6">{message}</p>
      </div>
    </div>
  );
}

function getDeploymentMessage() {
  if (isMockTarget) {
    return "Mock deployment target active. Wallet writes and contract reads are disabled unless you switch to local or Arc testnet configuration.";
  }

  if (isArcTestnetTarget) {
    if (!publicEnv.rpcUrl || publicEnv.rpcUrl.includes("127.0.0.1")) {
      return "Arc testnet target selected, but the RPC URL is still local or empty. Configure a reachable Arc testnet RPC before testing wallets.";
    }

    if (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken) {
      return "Arc testnet target selected without deployed contract addresses. The app will preserve mock fallback until MarketFactory and settlement token addresses are configured.";
    }

    return `Arc testnet target active for ${probityChain.name} (${probityChain.id}). Verify this chain metadata before public demos.`;
  }

  return null;
}
