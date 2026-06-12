# Local Contract Integration Workflow

This workflow connects the frontend read layer to local Foundry deployments without replacing the mock UI fallback.

1. Compile contracts:

```txt
pnpm --filter @probity/contracts build
```

2. Export ABI-only artifacts:

```txt
pnpm contracts:export-abis
```

3. Start a local chain:

```txt
pnpm chain:local
```

4. Deploy `MockUSDC` and `MarketFactory` with the local Foundry script:

```txt
pnpm contracts:deploy:local
```

The script approves the default Anvil deployer as resolver, approves local MockUSDC as an allowed settlement token, mints mock USDC to the first few Anvil accounts, and writes deployment addresses to:

```txt
deployments/local/addresses.json
```

Expected shape:

```json
{
  "chainId": 31337,
  "deploymentBlock": 1,
  "contracts": {
    "MarketFactory": "0x...",
    "MockUSDC": "0x..."
  },
  "markets": [],
  "metadata": {
    "deployer": "0x...",
    "resolver": "0x...",
    "mode": "local-anvil"
  }
}
```

5. Seed local markets:

```txt
pnpm contracts:seed:local
```

This calls the deployed `MarketFactory` and updates `deployments/local/addresses.json`
with the seeded market addresses for human inspection. The frontend reads live market
addresses from `MarketFactory.allMarkets()`.

The seed script also calls `setSettlementTokenApproval(MockUSDC, true)` so reseeding works against a fresh factory that enforces the settlement-token whitelist.

6. Configure frontend environment in `apps/web/.env.local`:

```txt
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEPLOYMENT_TARGET=local
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=
```

Environment variables override `deployments/local/addresses.json`, which is useful during rapid local redeploys.
Leave the address variables blank to use the generated deployment artifact.

7. Start the frontend:

```txt
pnpm --filter @probity/web dev
```

The app remains usable without deployed contracts. Read hooks are disabled when a valid factory address is missing, and mock market data remains the UI fallback.
If Anvil is stopped or the configured RPC is unavailable, contract reads fail safely and the market board returns to mock data.

## Cancellation, Refunds, and Evidence

Local markets created from the current contracts support resolver cancellation after expiration, factory-owner emergency cancellation after the unresolved grace period, and `claimRefund()` for remaining YES/NO balances on cancelled markets. Resolution calls require a non-empty evidence reference such as a URL, transaction hash, or IPFS URI. This is resolver-submitted evidence for auditability, not decentralized oracle resolution.

Older local deployments must be redeployed to test these flows because the ABI and bytecode changed. Legacy markets may remain readable, but they do not implement cancellation, refunds, or required resolution evidence.
