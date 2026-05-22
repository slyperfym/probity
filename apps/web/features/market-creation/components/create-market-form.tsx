"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, FileText, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = ["Macro", "Crypto", "Policy", "Arc", "Earnings"];

export function CreateMarketForm() {
  const searchParams = useSearchParams();
  const importedQuestion = searchParams.get("question") ?? "";
  const importedCategory = searchParams.get("category") ?? "Macro";
  const importedExpiry = searchParams.get("expiry") ?? "";
  const importedProbability = searchParams.get("probability") ?? "";
  const importedSource = searchParams.get("source");
  const [category, setCategory] = React.useState(
    categories.includes(importedCategory) ? importedCategory : "Macro"
  );
  const [question, setQuestion] = React.useState(importedQuestion);
  const [description, setDescription] = React.useState(() =>
    importedSource === "polymarket"
      ? "Drafted from external market reference metadata. Probity deployment, trading, settlement, and resolution remain Arc-native and independent."
      : ""
  );
  const [expiry, setExpiry] = React.useState(importedExpiry ? importedExpiry.slice(0, 10) : "");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Create Market</CardTitle>
          <Badge variant="info">{importedSource === "polymarket" ? "External reference draft" : "Demo draft"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          {importedSource === "polymarket" && (
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
              <div className="text-sm font-medium text-cyan-100">Reference imported from public market metadata</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This draft does not create or trade on Polymarket. It only pre-fills terms for a
                separate Probity market that would be deployed and settled on Arc.
              </p>
            </div>
          )}

          <Field label="Market question">
            <input
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Will a defined event occur by a specific date?"
              value={question}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="min-h-28 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the market and the institutional signal it is intended to capture."
              value={description}
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <Button
                    key={item}
                    onClick={() => setCategory(item)}
                    size="sm"
                    type="button"
                    variant={category === item ? "outline" : "secondary"}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Expiration">
              <div className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                  onChange={(event) => setExpiry(event.target.value)}
                  type="date"
                  value={expiry}
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Settlement token">
              <div className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                USDC
              </div>
            </Field>
            <Field label="Resolver">
              <input
                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
                placeholder="Probity Resolver Desk"
              />
            </Field>
          </div>

          <Field label="Resolution criteria">
            <textarea
              className="min-h-32 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
              placeholder="Define YES, NO, invalid/cancelled cases, and acceptable source references."
              defaultValue={
                importedProbability
                  ? `Initial displayed probability reference: ${importedProbability}% YES. Define independent Probity YES/NO criteria before deployment.`
                  : undefined
              }
            />
          </Field>

          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <FileText className="h-4 w-4" />
              Submission disabled
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This form is UI-only. Factory deployment and market creation writes will be added after
              the contract layer is implemented.
            </p>
          </div>

          <div className="flex justify-end">
            <Button disabled>Submit Market</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
