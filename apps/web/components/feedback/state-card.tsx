import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StateCardKind = "empty" | "error" | "loading";

const defaultIcons: Record<StateCardKind, LucideIcon> = {
  empty: Inbox,
  error: AlertTriangle,
  loading: Loader2
};

export function StateCard({
  className,
  description,
  icon,
  kind = "empty",
  title
}: {
  className?: string;
  description: string;
  icon?: LucideIcon;
  kind?: StateCardKind;
  title: string;
}) {
  const Icon = icon ?? defaultIcons[kind];

  return (
    <Card className={cn("border-dashed border-slate-300 bg-white/95 shadow-sm", className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border",
            kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : kind === "loading"
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-slate-200 bg-slate-50 text-slate-500"
          )}
        >
          <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} />
        </div>
        <div className="mt-4 text-sm font-semibold text-slate-950">{title}</div>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
