import { cn } from "@/lib/utils";

export function ProbabilityBar({
  yesProbability,
  className
}: {
  yesProbability: number;
  className?: string;
}) {
  const noProbability = 100 - yesProbability;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-700">YES {yesProbability}%</span>
        <span className="font-semibold text-rose-700">NO {noProbability}%</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${yesProbability}%` }}
        />
        <div className="h-full flex-1 bg-rose-400/75" />
      </div>
    </div>
  );
}
