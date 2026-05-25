"use client";

import Link from "next/link";
import { Activity, ExternalLink, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import type { OnchainActivityItem } from "@/features/activity/types";

const ARC_EXPLORER_TX_URL = "https://testnet.arcscan.app/tx";

export function OnchainActivityList({
  emptyDescription,
  isLoading,
  items,
  title = "Onchain Activity"
}: {
  emptyDescription: string;
  isLoading?: boolean;
  items: OnchainActivityItem[];
  title?: string;
}) {
  if (isLoading && items.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-5 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300/80" />
          Reading onchain activity from Arc Testnet...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <StateCard
        description={emptyDescription}
        icon={Activity}
        title={title === "Recent Activity" ? "No onchain activity" : "No market activity"}
      />
    );
  }

  return (
    <Card className="bg-slate-950/75">
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {isLoading && (
            <span className="inline-flex items-center gap-2 text-xs text-cyan-200/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2 sm:p-5 sm:pt-2">
        {items.map((item) => (
          <div
            className="rounded-lg border border-white/[0.07] bg-white/[0.018] p-3"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={badgeVariant(item.kind)}>{item.action}</Badge>
                  <Badge className="border-white/10 bg-white/[0.025] text-slate-400" variant="muted">
                    {item.status}
                  </Badge>
                </div>
                <Link
                  className="mt-2 block truncate text-sm font-medium text-slate-100 transition hover:text-cyan-100"
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
                className="rounded-md border border-white/[0.07] bg-slate-950/60 p-2 text-slate-500 transition hover:border-cyan-300/20 hover:text-cyan-200"
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

function badgeVariant(kind: OnchainActivityItem["kind"]) {
  if (kind === "claim" || kind === "resolve") return "yes";
  if (kind === "sell") return "no";
  if (kind === "create") return "info";

  return "muted";
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
