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
