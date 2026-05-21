import Link from "next/link";
import { Activity, BarChart3 } from "lucide-react";

import { WalletConnectionAlert } from "@/components/web3/wallet-connection-alert";
import { WalletConnectButton } from "@/components/web3/wallet-connect-button";

const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Create", href: "/create" },
  { label: "Admin", href: "/admin" }
];

export function SiteHeader() {
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
            <div className="hidden items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 sm:flex">
              <Activity className="h-3.5 w-3.5" />
              Arc ready
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </div>
      <WalletConnectionAlert />
    </header>
  );
}
