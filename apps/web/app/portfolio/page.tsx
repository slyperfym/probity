import { Badge } from "@/components/ui/badge";
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard";

export const metadata = {
  title: "Portfolio | Probity",
  description: "Wallet portfolio for Probity prediction markets"
};

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Badge className="border-cyan-300/20 bg-cyan-400/[0.055] text-cyan-100/85 shadow-none" variant="info">
            Portfolio
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-100 sm:text-4xl">
            Wallet-level exposure and rewards.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Live wallet positions, claim status, and onchain activity from deployed PredictionMarket contracts.
          </p>
        </div>
      </section>

      <PortfolioDashboard />
    </main>
  );
}
