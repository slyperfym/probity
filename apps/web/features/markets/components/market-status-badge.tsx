import { Badge } from "@/components/ui/badge";
import type { MarketOutcome, MarketStatus } from "@/features/markets/types";

export function MarketStatusBadge({
  outcome,
  status
}: {
  outcome?: MarketOutcome;
  status: MarketStatus;
}) {
  const label = getMarketStateLabel(status, outcome);
  const variant =
    status === "active"
      ? "info"
      : status === "resolved" && outcome === "no"
        ? "no"
        : status === "resolved"
          ? "yes"
          : "muted";

  return <Badge variant={variant}>{label}</Badge>;
}

export function getMarketStateLabel(status: MarketStatus, outcome?: MarketOutcome) {
  if (status === "active") {
    return "Active";
  }

  if (status === "expired") {
    return "Awaiting resolution";
  }

  if (outcome === "yes") {
    return "Resolved YES";
  }

  if (outcome === "no") {
    return "Resolved NO";
  }

  return "Resolved";
}
