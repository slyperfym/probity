import type { Metadata } from "next";

import {
  ExampleMarketsPanel,
  ProtocolEvidencePanel
} from "@/features/protocol/components/protocol-evidence-panel";

export const metadata: Metadata = {
  title: "Protocol Evidence | Probity",
  description: "Live Arc Testnet deployment evidence for Probity contracts and markets."
};

export default function ProtocolEvidencePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Live deployment
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Protocol Evidence
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Probity markets settle independently on Arc Testnet contracts. This page exposes the
          active contract addresses and sampled deployed markets for reviewer verification.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <ProtocolEvidencePanel title="Active Arc Testnet Deployment" />
        <ExampleMarketsPanel />
      </div>
    </main>
  );
}
