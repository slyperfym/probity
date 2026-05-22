"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, PlugZap, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <Button className="min-w-28 opacity-70" disabled size="sm">
              <Wallet className="h-4 w-4" />
              Wallet
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button className="px-3 sm:px-4" onClick={openConnectModal} size="sm" type="button">
              <Wallet className="h-4 w-4" />
              Connect
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button onClick={openChainModal} size="sm" type="button" variant="outline">
              <PlugZap className="h-4 w-4" />
              Wrong Network
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] sm:inline-flex"
              )}
              onClick={openChainModal}
              type="button"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {chain.name}
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
            <Button
              className="max-w-36 px-3 sm:max-w-none sm:px-4"
              onClick={openAccountModal}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Wallet className="h-4 w-4" />
              <span className="truncate">{account.displayName || formatAddress(account.address)}</span>
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
