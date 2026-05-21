import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/feedback/state-card";
import type { PortfolioActivity } from "@/features/portfolio/types";

export function ActivityHistory({ activity }: { activity: PortfolioActivity[] }) {
  if (activity.length === 0) {
    return (
      <StateCard
        description="Wallet-level trading, resolution, and claim events will populate this stream."
        icon={Activity}
        title="No activity yet"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity.map((item) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={item.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{item.action}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.marketTitle}</div>
                </div>
                <div className="text-sm font-medium text-slate-200">{item.amount}</div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC"
                }).format(new Date(item.timestamp))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
