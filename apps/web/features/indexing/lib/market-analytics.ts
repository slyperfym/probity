import type { MarketAnalytics, MarketEntity, MarketSnapshotEntity } from "@probity/types";

const USDC_DECIMALS = 1_000_000;

export function calculateYesProbabilityBps(yesShares: bigint, noShares: bigint) {
  const totalShares = yesShares + noShares;

  if (totalShares === 0n) {
    return 5_000;
  }

  return Number((yesShares * 10_000n) / totalShares);
}

export function calculateMarketAnalytics(market: MarketEntity): MarketAnalytics {
  const yesProbabilityBps = calculateYesProbabilityBps(market.totalYesShares, market.totalNoShares);
  const liquidity = market.status === "resolved" ? 0n : market.totalDeposited;

  return {
    imbalanceBps: Math.abs(yesProbabilityBps - 5_000),
    isTradable: market.status === "active" && Date.now() < Number(market.expirationTime) * 1000,
    liquidityUsd: toUsd(liquidity),
    marketId: market.id,
    noProbability: (10_000 - yesProbabilityBps) / 100,
    volumeUsd: toUsd(market.totalDeposited),
    yesProbability: yesProbabilityBps / 100
  };
}

export function calculateSnapshotChange(snapshots: MarketSnapshotEntity[]) {
  const [latest, previous] = [...snapshots].sort((a, b) => Number(b.blockNumber - a.blockNumber));

  if (!latest || !previous) {
    return 0;
  }

  return (latest.yesProbabilityBps - previous.yesProbabilityBps) / 100;
}

function toUsd(value: bigint) {
  return Number(value) / USDC_DECIMALS;
}
