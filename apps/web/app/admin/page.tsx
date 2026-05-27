import { Gavel, ShieldCheck, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResolverDashboard } from "@/features/admin/components/resolver-dashboard";
import { mockResolverMarkets } from "@/features/admin/data/mock-resolver";

export const metadata = {
  title: "Admin | Probity",
  description: "Resolver dashboard for Probity"
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Badge className="border-cyan-300/20 bg-cyan-400/[0.055] text-cyan-100/85 shadow-none" variant="info">
            Resolver Admin
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-100 sm:text-4xl">
            Resolver operations dashboard.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Resolve expired deployed markets, monitor claimable outcomes, and preserve demo
            fallback behavior when contract addresses are unavailable.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:px-8">
        <ResolverDashboard markets={mockResolverMarkets} />
        <aside className="space-y-3 lg:space-y-4">
          <AdminControlCard
            icon={Gavel}
            label="Resolver mode"
            value="Onchain"
            text="PredictionMarket resolution is enabled when deployed contracts are reachable."
          />
          <AdminControlCard
            icon={TimerReset}
            label="SLA"
            value="11m"
            text="Demo average resolution time for dashboard composition."
          />
          <AdminControlCard
            icon={ShieldCheck}
            label="Access"
            value="Resolver-only"
            text="Resolution actions are enabled only for the resolver address stored on each market."
          />
        </aside>
      </section>
    </main>
  );
}

function AdminControlCard({
  icon: Icon,
  label,
  text,
  value
}: {
  icon: typeof Gavel;
  label: string;
  text: string;
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
        <div className="text-lg font-semibold text-white">{value}</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
      </CardContent>
    </Card>
  );
}
