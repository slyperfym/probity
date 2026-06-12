import type { MarketStatus } from "@/features/markets/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency"
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

export function formatUsd(value: number) {
  return currencyFormatter.format(value);
}

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function getStatusLabel(status: MarketStatus) {
  if (status === "active") {
    return "Active";
  }

  if (status === "expired") {
    return "Expired";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Resolved";
}
