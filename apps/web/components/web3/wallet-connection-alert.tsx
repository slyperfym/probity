"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAccount, useChainId, useConnect } from "wagmi";

import { probityChain, supportedChainIds } from "@/config/chains";
import { hasWalletConnectProjectId } from "@/config/env";
import { cn } from "@/lib/utils";

function getConnectionErrorMessage(error: Error | null) {
  if (!error) {
    return null;
  }

  const message = error.message.toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied")) {
    return "Wallet connection was cancelled in the wallet.";
  }

  if (message.includes("provider") || message.includes("connector")) {
    return "That wallet did not respond. Try MetaMask, refresh the page, or use WalletConnect if it is configured.";
  }

  if (message.includes("chain") || message.includes("network")) {
    return `Wallet connected on an unsupported network. Switch to ${probityChain.name}.`;
  }

  return "Wallet connection failed. Refresh the page and try MetaMask first if multiple wallet extensions are installed.";
}

export function WalletConnectionAlert() {
  const [dismissedError, setDismissedError] = React.useState<string | null>(null);
  const [dismissedProjectIdWarning, setDismissedProjectIdWarning] = React.useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { error, isError, reset } = useConnect();

  const unsupportedChain = isConnected && !supportedChainIds.includes(chainId);
  const connectionMessage = isError ? getConnectionErrorMessage(error) : null;
  const message = unsupportedChain
    ? `Wrong network. Switch to ${probityChain.name} (${probityChain.id}) to trade.`
    : connectionMessage;

  if (!message || dismissedError === message) {
    if (hasWalletConnectProjectId || dismissedProjectIdWarning) {
      return null;
    }

    return (
      <WalletWarning
        message="WalletConnect Project ID is not configured. Injected wallets still work."
        onDismiss={() => setDismissedProjectIdWarning(true)}
      />
    );
  }

  return (
    <WalletWarning
      message={message}
      onDismiss={() => {
        setDismissedError(message);
        reset();
      }}
    />
  );
}

function WalletWarning({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 py-2.5 text-sm text-amber-800 sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="flex-1 leading-6">{message}</p>
        <button
          aria-label="Dismiss wallet connection warning"
          className={cn(
            "rounded-md p-1 text-amber-700 transition hover:bg-amber-100 hover:text-amber-950"
          )}
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
