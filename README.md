# Probity

Probity is an institutional-grade prediction market platform built on Arc.

This repository is structured as a pnpm workspace monorepo:

- `apps/web`: Next.js App Router frontend
- `contracts`: Foundry smart contracts
- `packages/ui`: shared UI package
- `packages/config`: shared configuration package
- `packages/types`: shared TypeScript domain types
- `deployments`: generated ABI and address artifacts by network

## Local Blockchain Workflow

Start Anvil:

```txt
pnpm chain:local
```

In another terminal, deploy and seed local contracts:

```txt
pnpm contracts:deploy:local
pnpm contracts:seed:local
pnpm contracts:export-abis
```

Or run the deployment, seed, and ABI export steps together:

```txt
pnpm contracts:bootstrap:local
```

The Foundry scripts write `deployments/local/addresses.json`, which the web app reads
automatically when `NEXT_PUBLIC_DEPLOYMENT_TARGET=local`.

For the frontend, copy `apps/web/.env.local.example` to `apps/web/.env.local`.
Keep `NEXT_PUBLIC_MARKET_DATA_MODE=auto` for the default behavior: use deployed local
contracts when available and fall back to mock data when Anvil or addresses are unavailable.

Run the web app:

```txt
pnpm --filter @probity/web dev
```
