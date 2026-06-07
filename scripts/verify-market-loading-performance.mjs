import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const summaryRoute = readFileSync(new URL('../apps/web/app/api/markets/summary/route.ts', import.meta.url), 'utf8');
const chainsConfig = readFileSync(new URL('../apps/web/config/chains.ts', import.meta.url), 'utf8');
const marketsBoard = readFileSync(new URL('../apps/web/features/markets/components/markets-board.tsx', import.meta.url), 'utf8');

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

assert.doesNotMatch(
  summaryRoute,
  /"resolvedOutcome",/,
  'Market board summary should not read resolvedOutcome because it is not used in summary cards.'
);

assert.match(
  chainsConfig,
  /contracts:\s*publicEnv\.deploymentTarget === "arc-testnet"\s*\?\s*\{\s*multicall3:\s*\{\s*address:\s*"0xcA11bde05977b3631167028862bE2a173976CA11",\s*blockCreated:\s*0\s*\}\s*\}/s,
  'Client chain config should expose Multicall3 on Arc Testnet for wagmi useReadContracts.'
);

assert.match(
  marketsBoard,
  /React\.useState<CachedSummaryEntry \| undefined>\(\(\) => readCachedMarketSummaries\(\)\)/,
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

console.log('Market loading performance static verification passed.');
