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
  /React\.useState<MarketSummaryResponse \| undefined>\(\(\) => readCachedMarketSummaries\(\)\)/,
  'MarketsBoard should hydrate localStorage summaries in the initial state so reloads do not render a blocking loading screen.'
);

assert.match(
  marketsBoard,
  /initialData: refreshNonce === 0 \? cachedSummaryData : undefined/,
  'MarketsBoard query should use cached summaries as initial data for fast reloads.'
);

console.log('Market loading performance static verification passed.');
