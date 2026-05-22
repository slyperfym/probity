"use client";

import type { Wallet, WalletList } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  rainbowWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets";

import { hasWalletConnectProjectId, publicEnv } from "@/config/env";

type WalletFactory = WalletList[number]["wallets"][number];

type InjectedProvider = {
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKXWallet?: boolean;
  isBraveWallet?: boolean;
  _events?: unknown;
  _state?: unknown;
};

type WindowWithWallets = Window & {
  ethereum?: InjectedProvider & {
    providers?: InjectedProvider[];
  };
  okxwallet?: InjectedProvider;
};

const walletConnectProjectId = hasWalletConnectProjectId
  ? publicEnv.walletConnectProjectId
  : undefined;

function getInjectedProviders() {
  if (typeof window === "undefined") {
    return [];
  }

  const walletWindow = window as WindowWithWallets;
  const providers = walletWindow.ethereum?.providers ?? [];
  const primaryProvider = walletWindow.ethereum ? [walletWindow.ethereum] : [];

  return [...providers, ...primaryProvider].filter(Boolean);
}

function hasAnyInjectedProvider() {
  if (typeof window === "undefined") {
    return false;
  }

  const walletWindow = window as WindowWithWallets;
  return Boolean(walletWindow.ethereum || walletWindow.okxwallet);
}

function hasMetaMaskInjectedProvider() {
  return getInjectedProviders().some((provider) => {
    if (!provider.isMetaMask) {
      return false;
    }

    // Several wallet extensions historically set isMetaMask for compatibility.
    // These guards keep the dedicated MetaMask entry from accidentally binding
    // to Brave or another injected provider when many browser wallets are installed.
    if (provider.isBraveWallet && !provider._events && !provider._state) {
      return false;
    }

    return !provider.isOkxWallet && !provider.isOKXWallet;
  });
}

function hasOkxInjectedProvider() {
  if (typeof window === "undefined") {
    return false;
  }

  const walletWindow = window as WindowWithWallets;
  return Boolean(
    walletWindow.okxwallet ||
      getInjectedProviders().some((provider) => provider.isOkxWallet || provider.isOKXWallet)
  );
}

function hasCuratedInjectedProvider() {
  return hasMetaMaskInjectedProvider() || hasOkxInjectedProvider();
}

const probityMetaMaskWallet: WalletFactory = (params) => {
  const wallet = metaMaskWallet(params);

  return {
    ...wallet,
    hidden: () => {
      // Without WalletConnect, only show MetaMask when its extension is actually
      // available. Otherwise the modal can offer a QR/deep-link path that cannot
      // complete in local development.
      return !hasWalletConnectProjectId && !hasMetaMaskInjectedProvider();
    }
  };
};

const probityOkxWallet: WalletFactory = (params) => {
  const wallet = okxWallet(params);

  return {
    ...wallet,
    hidden: () => {
      // RainbowKit's OKX connector uses the OKX injected namespace when present,
      // and WalletConnect otherwise. Keep the WalletConnect path hidden until a
      // real project id is configured, because dummy project ids make OKX appear
      // to open while never finishing the session.
      return !hasWalletConnectProjectId && !hasOkxInjectedProvider();
    }
  };
};

const probityInjectedFallbackWallet: WalletFactory = (): Wallet => {
  const wallet = injectedWallet();

  return {
    ...wallet,
    name: "Browser Wallet",
    shortName: "Browser",
    hidden: () => {
      // Generic injected is a last-resort fallback. If MetaMask or OKX has a
      // dedicated connector, showing a second generic injected option can bind
      // to the same provider and create duplicate/conflicting connection paths.
      return !hasAnyInjectedProvider() || hasCuratedInjectedProvider();
    }
  };
};

const recommendedWallets: WalletFactory[] = [probityMetaMaskWallet, probityOkxWallet];

const walletConnectWallets: WalletFactory[] =
  hasWalletConnectProjectId && walletConnectProjectId
    ? [rainbowWallet, coinbaseWallet, walletConnectWallet]
    : [];

export const probityWalletList: WalletList = [
  {
    groupName: "Recommended",
    wallets: [...recommendedWallets, ...walletConnectWallets]
  },
  {
    groupName: "Fallback",
    wallets: [probityInjectedFallbackWallet]
  }
];
