import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.04] text-slate-200",
        yes: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        no: "border-rose-400/25 bg-rose-400/10 text-rose-200",
        info: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
        muted: "border-white/10 bg-slate-900 text-slate-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
