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
  const showArcDemoMode =
    isArcTestnetTarget &&
    (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl">
      <div className="border-b border-white/10">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2.5" href="/">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-400/18 bg-cyan-400/[0.055] text-cyan-200/90">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 sm:tracking-[0.22em]">
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
            {showArcDemoMode ? (
              <div className="hidden items-center gap-2 rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-100/85 lg:flex">
                <Activity className="h-3.5 w-3.5 text-cyan-300/80" />
                <span>Demo Mode</span>
                <span className="text-slate-600">/</span>
                <span>Arc Testnet Ready</span>
                <span className="text-slate-600">/</span>
                <span>Mock Data Active</span>
              </div>
            ) : null}
            <a
              aria-label="Get Arc testnet USDC from Circle faucet"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-cyan-400/18 bg-cyan-400/[0.055] px-2.5 text-xs font-medium text-cyan-100/85 transition hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-cyan-50 sm:gap-2 sm:px-4"
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
          ? "border-cyan-300/22 bg-cyan-400/[0.06] text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.045)]"
          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.035] hover:text-slate-100"
      )}
      href={href}
    >
      {children}
      {isActive && (
        <span className="absolute inset-x-2 -bottom-px h-px rounded-full bg-cyan-300/55" />
      )}
    </Link>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
