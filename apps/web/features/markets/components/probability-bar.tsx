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
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-emerald-200">YES {yesProbability}%</span>
        <span className="font-medium text-rose-200">NO {noProbability}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${yesProbability}%` }}
        />
        <div className="h-full flex-1 bg-rose-400/70" />
      </div>
    </div>
  );
}
