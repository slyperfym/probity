import { deploymentConfig } from "@/config/contracts";

export function SiteFooter() {
  const dataStatus =
    deploymentConfig.hasMarketFactory && deploymentConfig.hasSettlementToken
      ? "Arc Testnet onchain"
      : "Contracts not configured";

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <p>Probity builds transparent forecasting infrastructure for stablecoin-native markets.</p>
          <p>All Probity markets settle independently on Arc Testnet contracts.</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <span>Live MVP</span>
          <span>Arc Testnet</span>
          <span>{dataStatus}</span>
        </div>
      </div>
    </footer>
  );
}
