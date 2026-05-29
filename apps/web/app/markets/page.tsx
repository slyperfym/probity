import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MarketsBoard } from "@/features/markets/components/markets-board";

export const metadata = {
  title: "Markets | Probity",
  description: "Browse Probity Arc Testnet prediction markets"
};

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="probity-grid border-b border-slate-200">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <Badge variant="info">
            Market Board
          </Badge>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                Forecasting markets
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Browse Arc-native YES/NO markets.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Arc Testnet
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
        <MarketsBoard />
      </section>
    </main>
  );
}
