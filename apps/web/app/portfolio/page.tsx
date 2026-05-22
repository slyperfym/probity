import { Badge } from "@/components/ui/badge";
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard";

export const metadata = {
  title: "Portfolio | Probity",
  description: "Demo user portfolio for Probity prediction markets"
};

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Badge className="border-cyan-300/40 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]" variant="info">
            Portfolio
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
            Wallet-level exposure and rewards.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Live wallet positions are read from deployed PredictionMarket contracts when available,
            with mock fallback preserved for demo and local development.
          </p>
        </div>
      </section>

      <PortfolioDashboard />
    </main>
  );
}
