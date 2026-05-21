import type { ActivityFeedItem } from "@probity/types";
import { Activity, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return (
      <StateCard
        description="Indexed market creation, trade, resolution, and claim events will appear here."
        icon={Activity}
        title="No indexed activity"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.description}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{item.eventName}</span>
                <span>{shortHash(item.transactionHash)}</span>
                <span>{formatTimestamp(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}
