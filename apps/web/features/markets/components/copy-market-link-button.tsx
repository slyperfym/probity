"use client";

import * as React from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function CopyMarketLinkButton({ marketTitle }: { marketTitle: string }) {
  const [copiedAction, setCopiedAction] = React.useState<"link" | "share" | null>(null);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    showCopied("link");
  }

  async function copyShareText() {
    await navigator.clipboard.writeText(
      [
        "I’m testing this Arc-native market on Probity:",
        "",
        marketTitle,
        "",
        "YES/NO on Arc Testnet with USDC-style settlement.",
        window.location.href
      ].join("\n")
    );
    showCopied("share");
  }

  function showCopied(action: "link" | "share") {
    setCopiedAction(action);
    window.setTimeout(() => setCopiedAction(null), 1600);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton
        copied={copiedAction === "link"}
        icon={Link2}
        label="Copy link"
        onClick={copyLink}
      />
      <CopyButton
        copied={copiedAction === "share"}
        icon={Share2}
        label="Copy share text"
        onClick={copyShareText}
      />
    </div>
  );
}

function CopyButton({
  copied,
  icon: Icon,
  label,
  onClick
}: {
  copied: boolean;
  icon: typeof Link2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      onClick={onClick}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
