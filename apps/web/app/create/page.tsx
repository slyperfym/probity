import { FilePlus2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateMarketForm } from "@/features/market-creation/components/create-market-form";

export const metadata = {
  title: "Create Market | Probity",
  description: "Mock market creation UI for Probity"
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="probity-grid border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Badge variant="info">Create</Badge>
          <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
            Design a deterministic YES/NO market.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
            Draft institutional-grade market terms, resolution criteria, resolver assignment,
            and USDC-style settlement parameters before factory integration.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <CreateMarketForm />
        <aside className="space-y-4">
          <GuidelineCard
            icon={FilePlus2}
            title="Market quality"
            text="Every market should define a clear YES condition, NO condition, expiry, source of truth, and invalid/cancelled handling."
          />
          <GuidelineCard
            icon={ShieldCheck}
            title="Resolver accountability"
            text="Resolver selection remains centralized in this mock layer. Role-gated factory creation comes later."
          />
        </aside>
      </section>
    </main>
  );
}

function GuidelineCard({
  icon: Icon,
  text,
  title
}: {
  icon: typeof FilePlus2;
  text: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-400">{text}</p>
      </CardContent>
    </Card>
  );
}
