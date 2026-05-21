"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

import { hasWalletConnectProjectId, publicEnv } from "@/config/env";
import { probityChain, supportedChains } from "@/config/chains";
import { probityWalletList } from "@/config/wallets";

const localWalletConnectProjectId = "probity-local-walletconnect-disabled";
const projectId = publicEnv.walletConnectProjectId || localWalletConnectProjectId;

export const wagmiConfig = getDefaultConfig({
  appName: "Probity",
  appDescription: "Institutional-grade prediction markets on Arc",
  appUrl: publicEnv.appUrl,
  projectId,
  wallets: probityWalletList,
  walletConnectParameters: hasWalletConnectProjectId
    ? {
        metadata: {
          name: "Probity",
          description: "Institutional-grade prediction markets on Arc",
          url: publicEnv.appUrl,
          icons: [`${publicEnv.appUrl}/icon.png`]
        }
      }
    : undefined,
  chains: supportedChains,
  ssr: true,
  transports: {
    [probityChain.id]: http(publicEnv.rpcUrl)
  }
});
