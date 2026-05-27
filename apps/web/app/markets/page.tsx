import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MarketsBoard } from "@/features/markets/components/markets-board";

export const metadata = {
  title: "Markets | Probity",
  description: "Browse Probity demo prediction markets"
};

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Badge className="border-cyan-300/20 bg-cyan-400/[0.055] text-cyan-100/85 shadow-none" variant="info">
            Market Board
          </Badge>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-slate-100 sm:text-4xl">
                Forecasting markets for institutional signal.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Browse Arc-native YES/NO markets with USDC settlement.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-md border border-cyan-400/14 bg-cyan-400/[0.045] px-3 py-2 text-xs font-medium text-cyan-100/80">
              <BarChart3 className="h-4 w-4 text-cyan-300/80" />
              Arc testnet onchain demo
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <MarketsBoard />
      </section>
    </main>
  );
}
