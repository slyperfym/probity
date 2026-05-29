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
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
          <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} />
        </div>
        <div className="mt-4 text-sm font-medium text-slate-950">{title}</div>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
