import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const summaryRoute = readFileSync(new URL('../apps/web/app/api/markets/summary/route.ts', import.meta.url), 'utf8');
const chainsConfig = readFileSync(new URL('../apps/web/config/chains.ts', import.meta.url), 'utf8');
const marketsBoard = readFileSync(new URL('../apps/web/features/markets/components/markets-board.tsx', import.meta.url), 'utf8');
const portfolioDashboard = readFileSync(new URL('../apps/web/features/portfolio/components/portfolio-dashboard.tsx', import.meta.url), 'utf8');
const activityHook = readFileSync(new URL('../apps/web/features/activity/hooks/use-onchain-activity.ts', import.meta.url), 'utf8');

assert.match(
  summaryRoute,
  /MULTICALL3_ADDRESS\s*=\s*"0xcA11bde05977b3631167028862bE2a173976CA11"/,
  'Summary API should define Arc Testnet Multicall3 so viem multicall does not fall back to slow per-market reads.'
);

assert.match(
  summaryRoute,
  /contracts:\s*\{\s*multicall3:\s*\{\s*address:\s*MULTICALL3_ADDRESS,\s*blockCreated:\s*0\s*\}\s*\}/s,
  'Summary API chain config should include multicall3 contract metadata.'
);

assert.match(
  summaryRoute,
  /const ACTIVE_CACHE_MS = 120_000;/,
  'Summary API should keep a two-minute active cache to avoid repeated RPC reads during reload storms.'
);

assert.match(
  summaryRoute,
  /serve stale summary immediately and refresh in the background/i,
  'Summary API should serve stale cached summaries immediately on normal reloads instead of blocking on RPC.'
);

assert.match(
  summaryRoute,
  /"resolvedOutcome",/,
  'Shared market snapshots should include resolvedOutcome so Portfolio can detect winning claimable positions without extra metadata reads.'
);

assert.match(
  chainsConfig,
  /contracts:\s*publicEnv\.deploymentTarget === "arc-testnet"\s*\?\s*\{\s*multicall3:\s*\{\s*address:\s*"0xcA11bde05977b3631167028862bE2a173976CA11",\s*blockCreated:\s*0\s*\}\s*\}/s,
  'Client chain config should expose Multicall3 on Arc Testnet for wagmi useReadContracts.'
);

assert.match(
  marketsBoard,
  /React\.useState<CachedMarketSummaryEntry \| undefined>\(\(\) => readCachedMarketSummaries\(\)\)/,
  'MarketsBoard should hydrate localStorage summaries in the initial state so reloads do not render a blocking loading screen.'
);

assert.match(
  marketsBoard,
  /initialData:\s*cachedSummaryEntry\?\.response/,
  'MarketsBoard query should use cached summaries as initial data for fast reloads.'
);

assert.match(
  marketsBoard,
  /initialDataUpdatedAt:\s*cachedSummaryEntry\?\.cachedAt/,
  'MarketsBoard query should preserve localStorage cache age so React Query does not refetch immediately after navigation.'
);

assert.match(
  marketsBoard,
  /queryKey:\s*\["probity", "market-summaries"\]/,
  'MarketsBoard should use a stable market summary query key so manual refreshes dedupe instead of creating new cache entries.'
);

assert.doesNotMatch(
  marketsBoard,
  /refetchInterval:\s*30_000/,
  'MarketsBoard should not poll market summaries every 30 seconds while users are browsing.'
);

assert.match(
  marketsBoard,
  /getMarketsByFilter\(\s*boardMarkets,/s,
  'MarketsBoard stats should filter the complete in-memory market dataset, not only the visible page.'
);

assert.match(
  marketsBoard,
  /filteredMarkets\.slice\(0, visibleMarketLimit\)/,
  'MarketsBoard should slice only after filtering/aggregating so Load More only reveals in-memory markets.'
);

assert.doesNotMatch(
  marketsBoard,
  /limit:\s*visibleMarketLimit/,
  'MarketsBoard fallback contract reads should not be tied to Load More visibility.'
);

assert.match(
  marketsBoard,
  /includeParticipantCounts:\s*false/,
  'MarketsBoard fallback should skip participant log scans because list statistics do not use them.'
);

assert.doesNotMatch(
  portfolioDashboard,
  /useLocalContractMarkets/,
  'Portfolio should reuse cached market summaries instead of rediscovering all market metadata through client contract reads.'
);

assert.match(
  portfolioDashboard,
  /queryKey:\s*\["probity", "market-summaries"\]/,
  'Portfolio should share the Markets page summary cache key.'
);

assert.match(
  portfolioDashboard,
  /functionName:\s*"getPosition"/,
  'Portfolio should batch wallet YES/NO/claim status with getPosition multicalls.'
);

assert.doesNotMatch(
  portfolioDashboard,
  /refetchInterval:\s*12_000/,
  'Portfolio position reads should not poll every 12 seconds.'
);

assert.match(
  portfolioDashboard,
  /positions\s*\n\s*\.filter\(\(position\) => isContractAddress\(position\.marketId\)\)/,
  'Portfolio activity scans should be limited to markets where the wallet has a position.'
);

assert.match(
  activityHook,
  /readCachedActivity\(cacheKey\)/,
  'Activity hooks should hydrate cached log scans before revalidating.'
);

console.log('Market loading performance static verification passed.');
