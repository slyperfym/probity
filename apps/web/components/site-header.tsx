import Link from "next/link";
import { Activity, BarChart3, Droplets } from "lucide-react";

import { DeploymentReadinessAlert } from "@/components/web3/deployment-readiness-alert";
import { WalletConnectionAlert } from "@/components/web3/wallet-connection-alert";
import { WalletConnectButton } from "@/components/web3/wallet-connect-button";
import { isArcTestnetTarget } from "@/config/chains";
import { deploymentConfig } from "@/config/contracts";

const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Create", href: "/create" },
  { label: "Admin", href: "/admin" }
];

const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

export function SiteHeader() {
  const showArcDemoMode =
    isArcTestnetTarget &&
    (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl">
      <div className="border-b border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
                Probity
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">Arc prediction markets</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showArcDemoMode ? (
              <div className="hidden items-center gap-2 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100 lg:flex">
                <Activity className="h-3.5 w-3.5 text-cyan-300" />
                <span>Demo Mode</span>
                <span className="text-slate-600">/</span>
                <span>Arc Testnet Ready</span>
                <span className="text-slate-600">/</span>
                <span>Mock Data Active</span>
              </div>
            ) : null}
            <a
              aria-label="Get Arc testnet USDC from Circle faucet"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 hover:text-white sm:px-4"
              href={CIRCLE_FAUCET_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Droplets className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Get Faucet</span>
              <span className="sm:hidden">Faucet</span>
            </a>
            <WalletConnectButton />
          </div>
        </div>
      </div>
      <DeploymentReadinessAlert />
      <WalletConnectionAlert />
    </header>
  );
}
