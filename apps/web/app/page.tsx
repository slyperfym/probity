import {
  ArrowRight,
  BadgeDollarSign,
  Database,
  Gauge,
  Landmark,
  LineChart,
  LockKeyhole,
  Network,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { cn } from "@/lib/utils";

const protocolFlow = [
  {
    label: "Create",
    title: "Deploy market",
    description: "Approved creators launch Arc-native YES/NO markets."
  },
  {
    label: "Trade",
    title: "Trade YES/NO",
    description: "Wallets use Arc testnet USDC for gas and settlement."
  },
  {
    label: "Resolve",
    title: "Resolve outcome",
    description: "The configured resolver finalizes expired markets."
  },
  {
    label: "Claim",
    title: "Claim payout",
    description: "Winning positions claim settlement onchain."
  }
];

const features = [
  {
    icon: BadgeDollarSign,
    title: "Stablecoin-native settlement",
    description:
      "Arc testnet USDC funds wallet gas and market settlement, keeping accounting clear from trade to claim."
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
  { label: "Network", value: "Arc Testnet" },
  { label: "Status", value: "Live MVP" },
  { label: "Settlement", value: "USDC-style" }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#f7f7f2]">
      <section className="probity-grid relative border-b border-slate-200">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:min-h-[620px] lg:grid-cols-[0.96fr_1.04fr] lg:gap-10 lg:px-8 lg:py-14">
          <div className="probity-fade-up">
            <Badge className="mb-4" variant="info">
              Arc-native markets
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Prediction markets on Arc
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Create, trade, resolve, and claim YES/NO markets with Arc testnet USDC.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className={cn(buttonVariants({ size: "lg" }))} href="/markets">
                Explore Markets
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className={cn(buttonVariants({ size: "lg", variant: "secondary" }))} href="/create">
                Create Market
              </Link>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2.5">
              {metrics.map((metric) => (
                <div
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                  key={metric.label}
                >
                  <div className="text-sm font-semibold text-slate-950 sm:text-base">
                    {metric.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
            <TrustStrip className="mt-3 max-w-xl" />
          </div>

          <div className="probity-fade-in relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.09)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-950">Protocol Flow</div>
                  <div className="text-xs text-slate-500">Arc Testnet</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="probity-pulse h-2 w-2 rounded-full bg-emerald-400" />
                  Onchain
                </div>
              </div>
              <div className="space-y-3 p-3">
                {protocolFlow.map((step, index) => (
                  <ProtocolFlowRow index={index + 1} key={step.label} step={step} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 sm:py-20" id="markets">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="muted">Arc Testnet MVP</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
                Browse real deployed markets from the Market Board.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Explore live Arc Testnet markets and open any market for trading.
              </p>
            </div>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/markets">
              Open Market Board
              <LineChart className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {protocolFlow.map((step, index) => (
              <Card className="transition hover:border-indigo-200 hover:shadow-[0_16px_44px_rgba(79,70,229,0.08)]" key={step.label}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700">
                      {index + 1}
                    </div>
                    <Badge>{step.label}</Badge>
                  </div>
                  <CardTitle className="leading-6">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f2] py-16 sm:py-20" id="infrastructure">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="info">Infrastructure</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Settlement-first market infrastructure.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Clean market lifecycle, USDC-style settlement, and transparent onchain accounting.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-14" id="analytics">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <SignalCard
            icon={Gauge}
            label="Markets"
            title="YES/NO market states"
            value="Live"
          />
          <SignalCard
            icon={Landmark}
            label="Settlement"
            title="USDC-style collateral"
            value="USDC"
          />
          <SignalCard
            icon={LockKeyhole}
            label="Resolution"
            title="Resolver-controlled finality"
            value="Claim"
          />
        </div>
      </section>
    </main>
  );
}

function ProtocolFlowRow({
  index,
  step
}: {
  index: number;
  step: (typeof protocolFlow)[number];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-200">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700">
          {index}
        </div>
        <div>
          <Badge>{step.label}</Badge>
          <div className="mt-2 text-sm font-medium leading-6 text-slate-950">{step.title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
        </div>
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
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-medium text-slate-950">{title}</div>
        </div>
      </div>
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
