"use client";

import Link from "next/link";
import { Activity, Droplets } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { ReactNode } from "react";
import { getAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DeploymentReadinessAlert } from "@/components/web3/deployment-readiness-alert";
import { WalletConnectionAlert } from "@/components/web3/wallet-connection-alert";
import { WalletConnectButton } from "@/components/web3/wallet-connect-button";
import { isArcTestnetTarget } from "@/config/chains";
import { deploymentConfig, getMarketFactoryConfig, hasContractAddress } from "@/config/contracts";
import { cn } from "@/lib/utils";

const publicNavItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" }
];

const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

export function SiteHeader() {
  const pathname = usePathname();
  const { address: accountAddress } = useAccount();
  const normalizedAccount = accountAddress ? getAddress(accountAddress) : undefined;
  const showArcSetupMode =
    isArcTestnetTarget &&
    (!deploymentConfig.hasMarketFactory || !deploymentConfig.hasSettlementToken);
  const shouldReadAccess =
    deploymentConfig.marketDataMode !== "mock" && hasContractAddress("MarketFactory") && Boolean(normalizedAccount);
  const factoryConfig = getMarketFactoryConfig();
  const approvedCreator = useReadContract({
    ...factoryConfig,
    args: normalizedAccount ? [normalizedAccount] : undefined,
    functionName: "approvedCreators",
    query: {
      enabled: shouldReadAccess
    }
  });
  const approvedResolver = useReadContract({
    ...factoryConfig,
    args: normalizedAccount ? [normalizedAccount] : undefined,
    functionName: "approvedResolvers",
    query: {
      enabled: shouldReadAccess
    }
  });
  const navItems = React.useMemo(
    () => [
      ...publicNavItems,
      ...(approvedCreator.data ? [{ label: "Create", href: "/create" }] : []),
      ...(approvedResolver.data ? [{ label: "Admin", href: "/admin" }] : [])
    ],
    [approvedCreator.data, approvedResolver.data]
  );

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl">
      <div className="border-b border-slate-200/80">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-2.5 px-3 py-1.5 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2" href="/">
            <LogoMark />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-[0.12em] text-slate-950 sm:tracking-[0.16em]">
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
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 sm:gap-2 sm:px-3.5"
              href={CIRCLE_FAUCET_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Droplets className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Get Faucet</span>
              <span className="sm:hidden">Faucet</span>
            </a>
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-3 pb-2 md:hidden">
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

function LogoMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-end justify-center gap-0.5 rounded-xl border border-indigo-200 bg-white p-1.5 shadow-sm">
      <span className="h-3 w-1.5 rounded-full bg-indigo-500" />
      <span className="h-[18px] w-1.5 rounded-full bg-emerald-500" />
      <span className="h-2.5 w-1.5 rounded-full bg-slate-900" />
    </div>
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
        "relative inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-sm transition",
        isActive
          ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.06)]"
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
