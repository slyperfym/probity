import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/features/markets/lib/formatters";
import type { MarketStatus } from "@/features/markets/types";

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  const variant = status === "active" ? "info" : status === "resolved" ? "yes" : "muted";

  return <Badge variant={variant}>{getStatusLabel(status)}</Badge>;
}
