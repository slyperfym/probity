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
    ? `Unsupported network. Probity is configured for ${probityChain.name} (${probityChain.id}). Wallet writes are disabled until you switch networks.`
    : connectionMessage;

  if (!message || dismissedError === message) {
    if (hasWalletConnectProjectId || dismissedProjectIdWarning) {
      return null;
    }

    return (
      <WalletWarning
        message="Developer note: WalletConnect/Reown Project ID is not configured. Mobile QR and deep-link wallet options are hidden, while injected browser wallets remain available. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID locally and in Vercel to enable mobile wallet discovery."
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
    <div className="border-b border-amber-400/20 bg-amber-400/10">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 py-3 text-sm text-amber-100 sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="flex-1 leading-6">{message}</p>
        <button
          aria-label="Dismiss wallet connection warning"
          className={cn(
            "rounded-md p-1 text-amber-200 transition hover:bg-amber-300/10 hover:text-white"
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
