"use client";

import type * as React from "react";
import Link from "next/link";
import { Activity, ExternalLink, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnchainActivityItem } from "@/features/activity/types";

const ARC_EXPLORER_TX_URL = "https://testnet.arcscan.app/tx";

export function OnchainActivityList({
  emptyDescription,
  emptyTitle = "No onchain activity",
  error,
  isLoading,
  items,
  loadingMessage = "Reading onchain activity from Arc Testnet...",
  title = "Onchain Activity"
}: {
  emptyDescription: string;
  emptyTitle?: string;
  error?: string | null;
  isLoading?: boolean;
  items: OnchainActivityItem[];
  loadingMessage?: string;
  title?: string;
}) {
  const hasItems = items.length > 0;

  return (
    <Card>
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {isLoading && hasItems && (
            <span className="inline-flex items-center gap-2 text-xs text-indigo-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2 sm:p-5 sm:pt-2">
        {!hasItems && isLoading && (
          <ActivityState
            description={loadingMessage}
            icon={<Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
            kind="loading"
            title="Reading activity"
          />
        )}
        {!hasItems && !isLoading && error && (
          <ActivityState
            description={error}
            icon={<Activity className="h-4 w-4 text-rose-600" />}
            kind="error"
            title="Could not load activity"
          />
        )}
        {!hasItems && !isLoading && !error && (
          <ActivityState
            description={emptyDescription}
            icon={<Activity className="h-4 w-4 text-slate-500" />}
            kind="empty"
            title={emptyTitle}
          />
        )}
        {items.map((item) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={badgeVariant(item.kind)}>{item.action}</Badge>
                  <Badge variant="muted">
                    {item.status}
                  </Badge>
                </div>
                <Link
                  className="mt-2 block truncate text-sm font-medium text-slate-950 transition hover:text-indigo-700"
                  href={`/markets/${item.marketAddress}`}
                >
                  {item.marketTitle}
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {item.amountLabel && <span>{item.amountLabel}</span>}
                  <span>Block {item.blockNumber.toString()}</span>
                  <span>{shortHash(item.transactionHash)}</span>
                </div>
              </div>
              <a
                aria-label="Open transaction on Arc Testnet explorer"
                className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
                href={`${ARC_EXPLORER_TX_URL}/${item.transactionHash}`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityState({
  description,
  icon,
  kind = "empty",
  title
}: {
  description: string;
  icon: React.ReactNode;
  kind?: "empty" | "error" | "loading";
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 shadow-sm">
      <div
        className={[
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
          kind === "error"
            ? "border-rose-200 bg-rose-50"
            : kind === "loading"
              ? "border-indigo-200 bg-indigo-50"
              : "border-slate-200 bg-slate-50"
        ].join(" ")}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-950">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function badgeVariant(kind: OnchainActivityItem["kind"]) {
  if (kind === "claim" || kind === "resolve") return "yes";
  if (kind === "sell") return "no";
  if (kind === "create") return "info";

  return "muted";
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
