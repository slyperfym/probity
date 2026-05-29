"use client";

import Link from "next/link";
import { Activity, BarChart3, Droplets } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DeploymentReadinessAlert } from "@/components/web3/deployment-readiness-alert";
import { WalletConnectionAlert } from "@/components/web3/wallet-connection-alert";
import { WalletConnectButton } from "@/components/web3/wallet-connect-button";
import { isArcTestnetTarget } from "@/config/chains";
import { deploymentConfig } from "@/config/contracts";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Create", href: "/create" },
  { label: "Admin", href: "/admin" }
];

const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

export function SiteHeader() {
  const pathname = usePathname();
  const showArcSetupMode =
    isArcTestnetTarget &&
    (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken);

  return (
    <header className="sticky top-0 z-50 bg-white/88 backdrop-blur-xl">
      <div className="border-b border-slate-200/80">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2.5" href="/">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)]">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 sm:tracking-[0.22em]">
                Probity
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">Arc prediction markets</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavItem href={item.href} isActive={isActiveRoute(pathname, item.href)} key={item.label}>
                {item.label}
              </NavItem>
            ))}
          </nav>

          <div className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2">
            {showArcSetupMode ? (
              <div className="hidden items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 lg:flex">
                <Activity className="h-3.5 w-3.5 text-indigo-600" />
                <span>Setup Mode</span>
                <span className="text-slate-300">/</span>
                <span>Arc Testnet Ready</span>
                <span className="text-slate-300">/</span>
                <span>Contract Addresses Pending</span>
              </div>
            ) : null}
            <a
              aria-label="Get Arc testnet USDC from Circle faucet"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 sm:gap-2 sm:px-4"
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
        <nav className="no-scrollbar mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-3 pb-3 md:hidden">
          {navItems.map((item) => (
            <NavItem href={item.href} isActive={isActiveRoute(pathname, item.href)} key={item.label}>
              {item.label}
            </NavItem>
          ))}
        </nav>
      </div>
      <DeploymentReadinessAlert />
      <WalletConnectionAlert />
    </header>
  );
}

function NavItem({
  children,
  href,
  isActive
}: {
  children: ReactNode;
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-sm transition",
        isActive
          ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.08)]"
          : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950"
      )}
      href={href}
    >
      {children}
      {isActive && (
        <span className="absolute inset-x-2 -bottom-px h-px rounded-full bg-indigo-500/70" />
      )}
    </Link>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
