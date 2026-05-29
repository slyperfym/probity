import { Suspense } from "react";
import { FilePlus2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateMarketForm } from "@/features/market-creation/components/create-market-form";

export const metadata = {
  title: "Create Market | Probity",
  description: "Market creation workspace for Probity"
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="probity-grid border-b border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Badge variant="info">
            Create Market
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            Create a YES/NO market
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Draft terms, resolver, expiry, and USDC settlement.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:px-8">
        <Suspense
          fallback={
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Loading market draft...
            </div>
          }
        >
          <CreateMarketForm />
        </Suspense>
        <aside className="space-y-3 lg:space-y-4">
          <GuidelineCard
            icon={FilePlus2}
            title="Market quality"
            text="Define YES, NO, expiry, and source of truth."
          />
          <GuidelineCard
            icon={ShieldCheck}
            title="Resolver accountability"
            text="Resolution is gated to the selected resolver wallet."
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
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}
