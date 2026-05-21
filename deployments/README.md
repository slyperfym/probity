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

`deployments/arc-testnet/addresses.json` intentionally contains empty placeholder addresses until Probity contracts are deployed to a reachable Arc testnet RPC.

Do not hardcode unofficial Arc RPC URLs, chain ids, explorers, or token addresses in source. Use environment variables and update deployment artifacts only after deployment.

For Arc testnet MVP testing, the settlement token should be a USDC-style ERC20 test token. If an official test USDC contract is available, configure that address. Otherwise, deploy a clearly named test settlement token and document it in the deployment artifact metadata.
