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
            <Button className="h-8 min-h-0 min-w-20 rounded-full px-3 opacity-70 sm:min-w-28" disabled size="sm">
              <Wallet className="h-4 w-4" />
              Wallet
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button
              className="h-8 min-h-0 rounded-full px-3 shadow-[0_8px_22px_rgba(79,70,229,0.16)] sm:px-4"
              onClick={openConnectModal}
              size="sm"
              type="button"
            >
              <Wallet className="h-4 w-4" />
              Connect
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              className="h-8 min-h-0 rounded-full border-amber-200 bg-amber-50 px-2.5 text-amber-800 hover:border-amber-300 hover:bg-amber-100 sm:px-3"
              onClick={openChainModal}
              size="sm"
              type="button"
              variant="outline"
            >
              <PlugZap className="h-4 w-4" />
              <span className="hidden sm:inline">Wrong Network</span>
              <span className="sm:hidden">Network</span>
            </Button>
          );
        }

        return (
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <button
              className={cn(
                "hidden h-8 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 text-xs font-medium text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 sm:inline-flex"
              )}
              onClick={openChainModal}
              type="button"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {chain.name}
              <ChevronDown className="h-3.5 w-3.5 text-emerald-700/70" />
            </button>
            <Button
              className="h-8 min-h-0 max-w-32 rounded-full border-slate-200 bg-white px-3 text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 sm:max-w-none sm:px-3.5"
              onClick={openAccountModal}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Wallet className="h-3.5 w-3.5 text-indigo-600" />
              <span className="max-w-20 truncate sm:max-w-32">{account.displayName || formatAddress(account.address)}</span>
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
