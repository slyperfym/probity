"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

import { publicEnv } from "@/config/env";
import { probityChain, supportedChains } from "@/config/chains";
import { probityWalletList } from "@/config/wallets";

const localWalletConnectProjectId = "probity-local-walletconnect-disabled";
const projectId = publicEnv.walletConnectProjectId || localWalletConnectProjectId;
const hasProjectId = publicEnv.walletConnectProjectId.trim().length > 0;

export const wagmiConfig = getDefaultConfig({
  appName: "Probity",
  appDescription: "Institutional-grade prediction markets on Arc",
  appUrl: publicEnv.appUrl,
  projectId,
  wallets: probityWalletList,
  walletConnectParameters: hasProjectId
    ? {
        metadata: {
          name: "Probity",
          description: "Institutional-grade prediction markets on Arc",
          url: publicEnv.appUrl,
          icons: [`${publicEnv.appUrl}/icon.svg`]
        }
      }
    : undefined,
  chains: supportedChains,
  ssr: true,
  transports: {
    [probityChain.id]: http(publicEnv.rpcUrl)
  }
});
