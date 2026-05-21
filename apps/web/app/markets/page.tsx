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
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Badge variant="info">Market Board</Badge>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Forecasting markets for institutional signal.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                Browse YES/NO markets across macro, crypto, policy, Arc infrastructure,
                and earnings. Public demo data stays active until Arc testnet contract
                addresses are configured.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-slate-300">
              <BarChart3 className="h-4 w-4 text-cyan-300" />
              Demo market data
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MarketsBoard />
      </section>
    </main>
  );
}
