import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const tradingPanel = readFileSync(new URL('../apps/web/features/trading/components/trading-panel.tsx', import.meta.url), 'utf8');
const rootPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(
  tradingPanel,
  /const tokenLabel = deploymentConfig\.isArcTestnet \? "Arc Testnet USDC" : "Local settlement token";/,
  'Trading panel should use explicit settlement-token labels, not generic USDC/Local USDC labels.'
);

assert.match(
  tradingPanel,
  /PreviewRow label="Share model" value="1 settlement token unit = 1 YES\/NO share"/,
  'Trading preview should disclose the current 1:1 share model.'
);

assert.doesNotMatch(
  tradingPanel,
  /const estimatedShares = Number\(amount \|\| 0\) \/ Math\.max\(selectedProbability \/ 100, 0\.01\);/,
  'Trading preview should not calculate shares from probability while the contract mints shares 1:1.'
);

assert.equal(
  rootPackage.scripts['verify:deployment:arc-testnet'],
  'node scripts/verify-probity-deployment.mjs',
  'Root package should expose verify:deployment:arc-testnet.'
);

readFileSync(new URL('./verify-probity-deployment.mjs', import.meta.url), 'utf8');

console.log('Phase 1 static verification passed.');
