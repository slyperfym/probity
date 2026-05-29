import { Badge } from "@/components/ui/badge";
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard";

export const metadata = {
  title: "Portfolio | Probity",
  description: "Wallet portfolio for Probity prediction markets"
};

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="probity-grid border-b border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Badge variant="info">
            Portfolio
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            Wallet exposure.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Positions, claims, and onchain activity.
          </p>
        </div>
      </section>

      <PortfolioDashboard />
    </main>
  );
}
