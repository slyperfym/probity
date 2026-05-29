import { BadgeDollarSign, FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const trustItems: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ShieldCheck, label: "Arc Testnet" },
  { icon: BadgeDollarSign, label: "USDC gas + settlement" },
  { icon: Landmark, label: "Onchain market contracts" },
  { icon: FileCheck2, label: "Explorer-verifiable payouts" }
];

export function TrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm",
        className
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => (
          <TrustItem icon={item.icon} key={item.label} label={item.label} />
        ))}
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-h-10 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-white text-indigo-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="leading-5">{label}</span>
    </div>
  );
}
