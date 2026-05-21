import { BriefcaseBusiness, Coins, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import { ActivityHistory } from "@/features/portfolio/components/activity-history";
import {
  ClaimableRewards,
  PortfolioPositions
} from "@/features/portfolio/components/portfolio-positions";
import {
  mockPortfolioActivity,
  mockPortfolioPositions
} from "@/features/portfolio/data/mock-portfolio";
import { formatUsd } from "@/features/markets/lib/formatters";

export const metadata = {
  title: "Portfolio | Probity",
  description: "Mock user portfolio for Probity prediction markets"
};

export default function PortfolioPage() {
  const totalValue = mockPortfolioPositions.reduce((sum, position) => sum + position.notionalUsd, 0);
  const claimable = mockPortfolioPositions.reduce((sum, position) => sum + position.claimableUsd, 0);
  const activePositions = mockPortfolioPositions.filter((position) => position.status === "active").length;

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Badge variant="info">Portfolio</Badge>
          <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
            Wallet-level exposure and rewards.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
            Mock positions, claimable rewards, and activity history. This page is ready for
            indexed wallet data once contracts and the indexer are integrated.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <PortfolioMetric icon={BriefcaseBusiness} label="Portfolio value" value={formatUsd(totalValue)} />
          <PortfolioMetric icon={Coins} label="Claimable" value={formatUsd(claimable)} />
          <PortfolioMetric icon={History} label="Active positions" value={String(activePositions)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <PortfolioPositions positions={mockPortfolioPositions} />
            <ActivityHistory activity={mockPortfolioActivity} />
          </div>
          <div className="space-y-6">
            <ClaimableRewards positions={mockPortfolioPositions} />
            <StateCard
              description="Loading states are available for future wallet/indexer hydration while preserving layout stability."
              kind="loading"
              title="Mock loading state"
            />
            <StateCard
              description="Indexer or RPC errors will render here with retry actions after data fetching is implemented."
              kind="error"
              title="Mock error state"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function PortfolioMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-4 w-4 text-cyan-300" />
        <CardTitle className="text-xs uppercase tracking-[0.16em] text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}
