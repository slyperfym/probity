import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Landmark,
  LineChart,
  LockKeyhole,
  Network,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const marketPreviews = [
  {
    category: "Macro",
    title: "Will the Fed cut rates at the next FOMC meeting?",
    yes: 64,
    no: 36,
    volume: "$18.4M",
    expires: "14d 06h",
    trend: "+3.2%"
  },
  {
    category: "Crypto",
    title: "Will spot ETH ETF weekly inflows exceed $1B this month?",
    yes: 41,
    no: 59,
    volume: "$7.8M",
    expires: "21d 11h",
    trend: "-1.8%"
  },
  {
    category: "Policy",
    title: "Will a US stablecoin market structure bill pass committee?",
    yes: 72,
    no: 28,
    volume: "$11.2M",
    expires: "32d 02h",
    trend: "+5.6%"
  }
];

const features = [
  {
    icon: BadgeDollarSign,
    title: "Stablecoin-native settlement",
    description:
      "USDC-style collateral and predictable Arc execution keep market accounting clear from trade to claim."
  },
  {
    icon: ShieldCheck,
    title: "Deterministic resolution",
    description:
      "Resolver-controlled outcomes, explicit expiration, and onchain payout logic make settlement auditable."
  },
  {
    icon: Database,
    title: "Transparent accounting",
    description:
      "Every purchase, position, resolution, and claim emits indexable events for institutional reporting."
  },
  {
    icon: Network,
    title: "Market infrastructure",
    description:
      "Built for macro, crypto, policy, and institutional forecasting workflows from day one."
  }
];

const metrics = [
  { label: "Demo volume", value: "$37.4M" },
  { label: "Active markets", value: "128" },
  { label: "Avg. resolution", value: "11m" }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="probity-grid relative border-b border-white/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="probity-fade-up">
            <Badge className="mb-6" variant="info">
              Institutional-grade prediction markets on Arc
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-7xl">
              Transparent forecasting markets for professional capital.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Probity brings stablecoin-native settlement, deterministic market resolution,
              and transparent onchain accounting to event forecasting across macro, crypto,
              policy, and financial markets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className={cn(buttonVariants({ size: "lg" }))} href="/markets">
                Explore Markets
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className={cn(buttonVariants({ size: "lg", variant: "secondary" }))} href="#infrastructure">
                View Protocol Design
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  key={metric.label}
                >
                  <div className="text-xl font-semibold text-white sm:text-2xl">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="probity-fade-in relative">
            <div className="rounded-lg border border-white/10 bg-slate-950/85 p-3 shadow-2xl shadow-cyan-950/20 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Probity Market Terminal</div>
                  <div className="text-xs text-slate-500">Demo market data</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span className="probity-pulse h-2 w-2 rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>
              <div className="space-y-3 p-3">
                {marketPreviews.map((market) => (
                  <MarketPreviewRow key={market.title} market={market} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-950 py-16 sm:py-20" id="markets">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="muted">Market Preview</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                Professional event markets, built for scanning.
              </h2>
            </div>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/markets">
              Open Market Board
              <LineChart className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {marketPreviews.map((market) => (
              <Card className="transition hover:border-cyan-300/30 hover:bg-slate-900/80" key={market.title}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge>{market.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {market.expires}
                    </div>
                  </div>
                  <CardTitle className="leading-6">{market.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <OutcomeTile label="YES" value={market.yes} variant="yes" />
                    <OutcomeTile label="NO" value={market.no} variant="no" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                    <span className="text-slate-500">Volume</span>
                    <span className="font-medium text-slate-200">{market.volume}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 sm:py-20" id="infrastructure">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="info">Infrastructure</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              A settlement-first architecture for serious forecasting.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
              Probity is designed around the parts institutions care about: predictable
              collateral, clear lifecycle states, resolver accountability, and contract-level
              payout guarantees.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card className="bg-slate-950/80" key={feature.title}>
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900/40 py-14" id="analytics">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <SignalCard
            icon={Gauge}
            label="Probability"
            title="Implied market signal"
            value="64%"
          />
          <SignalCard
            icon={Landmark}
            label="Settlement"
            title="USDC-style collateral"
            value="1:1"
          />
          <SignalCard
            icon={LockKeyhole}
            label="Resolution"
            title="Resolver-controlled finality"
            value="Audit"
          />
        </div>
      </section>
    </main>
  );
}

function MarketPreviewRow({
  market
}: {
  market: (typeof marketPreviews)[number];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge>{market.category}</Badge>
          <div className="mt-3 text-sm font-medium leading-6 text-white">{market.title}</div>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-300">
          <TrendingUp className="h-3.5 w-3.5" />
          {market.trend}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="h-2 overflow-hidden rounded-full bg-rose-400/20">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${market.yes}%` }}
          />
        </div>
        <div className="min-w-14 text-right text-sm font-semibold text-white">{market.yes}%</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{market.volume} volume</span>
        <span>Expires {market.expires}</span>
      </div>
    </div>
  );
}

function OutcomeTile({
  label,
  value,
  variant
}: {
  label: "YES" | "NO";
  value: number;
  variant: "yes" | "no";
}) {
  const color = variant === "yes" ? "text-emerald-200" : "text-rose-200";
  const bar = variant === "yes" ? "bg-emerald-400" : "bg-rose-400";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={color}>{value}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  title,
  value
}: {
  icon: typeof Gauge;
  label: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/80 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-medium text-white">{title}</div>
        </div>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
