"use client";

import type { Address } from "viem";

import { contractAddresses, deploymentConfig } from "@/config/contracts";
import { useMarketFactoryMarketCount } from "@/features/contracts/hooks/use-market-factory";
import { cn } from "@/lib/utils";

type ProtocolEvidencePanelProps = {
  className?: string;
  title?: string;
};

const ARCSCAN_ADDRESS_URL = "https://testnet.arcscan.app/address";

export function ProtocolEvidencePanel({
  className,
  title = "Live Arc Testnet"
}: ProtocolEvidencePanelProps) {
  const marketCountQuery = useMarketFactoryMarketCount({
    enabled: deploymentConfig.isArcTestnet && deploymentConfig.hasMarketFactory
  });
  const marketCount =
    typeof marketCountQuery.data === "bigint"
      ? marketCountQuery.data.toString()
      : deploymentConfig.marketCount !== undefined
        ? String(deploymentConfig.marketCount)
        : "Checking...";
  const factoryAddress = contractAddresses.MarketFactory;
  const settlementTokenAddress = contractAddresses.MockUSDC;

  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Protocol transparency
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <EvidenceItem label="Chain ID" value={String(deploymentConfig.chainId)} />
        <EvidenceItem label="Current market count" value={marketCount} />
        <EvidenceItem
          href={addressUrl(factoryAddress)}
          label="MarketFactory"
          value={formatAddress(factoryAddress)}
        />
        <EvidenceItem
          href={addressUrl(settlementTokenAddress)}
          label="Settlement token"
          value={formatAddress(settlementTokenAddress)}
        />
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
        External references are used only to draft markets. Settlement occurs exclusively on Probity
        Arc-native contracts.
      </p>
    </section>
  );
}

export function ExampleMarketsPanel() {
  const markets = deploymentConfig.markets;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
        Example deployed markets
      </div>
      <h2 className="mt-1 text-lg font-semibold text-slate-950">Arcscan Links</h2>
      <div className="mt-4 grid gap-2">
        {markets.map((market, index) => (
          <EvidenceItem
            href={addressUrl(market)}
            key={market}
            label={`Market ${index + 1}`}
            value={formatAddress(market)}
          />
        ))}
      </div>
    </section>
  );
}

function EvidenceItem({
  href,
  label,
  value
}: {
  href?: string;
  label: string;
  value: string;
}) {
  const content = (
    <>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="mt-1 block truncate font-mono text-sm font-semibold text-slate-950">{value}</span>
    </>
  );

  if (!href) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">{content}</div>;
  }

  return (
    <a
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-indigo-200 hover:bg-indigo-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

function addressUrl(address: Address | undefined) {
  return address ? `${ARCSCAN_ADDRESS_URL}/${address}` : undefined;
}

function formatAddress(address: Address | undefined) {
  if (!address) {
    return "Not configured";
  }

  return address;
}
