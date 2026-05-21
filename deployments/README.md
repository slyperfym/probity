# Deployment Artifacts

Generated contract artifacts live under a network directory:

```txt
deployments/
  local/
    addresses.json
    abis/
      MarketFactory.json
      PredictionMarket.json
      MockUSDC.json
  arc-testnet/
    addresses.json
    abis/
      MarketFactory.json
      PredictionMarket.json
      MockUSDC.json
```

Contracts are the source of truth. Deployment and export scripts should write ABI JSON and address files here after Foundry compilation/deployment.

## Local ABI export

After contracts are compiled with Foundry, export ABI-only artifacts:

```txt
pnpm contracts:export-abis
```

The script reads:

```txt
contracts/out/*/*.json
```

and writes ABI arrays to:

```txt
deployments/local/abis/*.json
deployments/arc-testnet/abis/*.json
```

Deployment scripts should write `addresses.json` after local or testnet deployment. The frontend also accepts explicit environment overrides, so it remains usable when `addresses.json` contains placeholders.

## Arc testnet placeholders

`deployments/arc-testnet/addresses.json` may contain empty placeholder addresses before deployment. After Arc testnet deployment or seeding, it should contain the latest `MarketFactory`, settlement token, and seeded market addresses.

Do not hardcode unofficial Arc RPC URLs, chain ids, explorers, or token addresses in source. Use environment variables and update deployment artifacts only after deployment.

For Arc testnet MVP testing, the settlement token should be the official/user-provided Arc testnet USDC-style token. Public demo wallets should obtain Arc testnet USDC from the Circle faucet before trading. MockUSDC is for local Anvil development only.

## Arc testnet deployment

The Arc testnet Foundry script writes addresses directly to:

```txt
deployments/arc-testnet/addresses.json
```

Run:

```txt
pnpm contracts:deploy:arc-testnet
pnpm contracts:export-abis
```

Or:

```txt
pnpm contracts:bootstrap:arc-testnet
```

Required shell environment:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
SETTLEMENT_TOKEN_ADDRESS=0x...
```

Optional:

```txt
RESOLVER_ADDRESS=0x...
SEED_DEMO_MARKETS=0
```

`SETTLEMENT_TOKEN_ADDRESS` is required for Arc testnet deployment and must point to an existing USDC-style token contract from official docs, a faucet, an explorer, or user-provided configuration. The Arc testnet deploy script does not deploy MockUSDC. Set `SEED_DEMO_MARKETS=1` only when you want the deployment script to create three demo markets during the same broadcast.

## Arc testnet market seeding

If Arc contracts are deployed but `/markets` shows zero contract markets, seed markets against the existing `MarketFactory`:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
RESOLVER_ADDRESS=0x...
SETTLEMENT_TOKEN_ADDRESS=0x...
pnpm contracts:seed:arc-testnet
pnpm contracts:export-abis
```

The seed script reads `deployments/arc-testnet/addresses.json`, uses the configured `SETTLEMENT_TOKEN_ADDRESS`, creates demo markets only when `marketCount()` is zero, then writes the latest `allMarkets()` output back to the same artifact. Set `FORCE_SEED_MARKETS=1` only if you intentionally want another set of demo markets.

## Frontend handoff

After a successful Arc testnet deployment:

1. Review `deployments/arc-testnet/addresses.json`.
2. Run `pnpm contracts:export-abis` after Foundry compilation.
3. Set Vercel environment variables:

```txt
NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=<MarketFactory from deployments/arc-testnet/addresses.json>
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=<configured Arc testnet USDC settlement token address>
```

Use a dedicated testnet deployer wallet, testnet funds only, and never commit `.env` files or private keys. Arc testnet public users need Arc testnet USDC from the Circle faucet for settlement and gas before trading.
