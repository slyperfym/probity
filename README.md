# Probity

Stablecoin-native prediction market infrastructure for institutional-grade forecasting on Arc.

Probity is a prediction market MVP designed around transparent onchain execution, deterministic resolver-controlled settlement, and a professional trading interface. It combines a Next.js frontend, local Foundry contracts, wallet connectivity, local trading flows, resolver/admin operations, and an indexing-ready data model.

The project is built as an Arc-ready protocol prototype. It is suitable for hackathon and ecosystem review, but it is not production-ready financial infrastructure.

## Product Overview

Probity lets users browse binary YES/NO forecasting markets, inspect market probability and liquidity, connect a wallet, trade local MockUSDC positions, and claim payouts after resolution. Resolver operators can review expired markets and resolve them YES or NO through the admin dashboard when using local deployed contracts.

The MVP is intentionally scoped around clear protocol mechanics rather than AMM complexity or production oracle infrastructure. It demonstrates the full product loop:

- Create and seed markets locally
- Buy YES or NO shares with a USDC-style settlement token
- Resolve expired markets through a resolver role
- Claim winning payouts
- Keep frontend data compatible with future indexing infrastructure

## Why Arc

Probity is designed for Arc's stablecoin-native infrastructure thesis:

- Predictable stablecoin-denominated market settlement
- Transparent onchain execution for institutional workflows
- Deterministic market resolution and payout accounting
- Compliance-ready architecture boundaries between trading, resolution, and indexing
- USDC-style settlement flows that map naturally to real-world forecasting markets
- Scalable infrastructure for macro, crypto, policy, and event-driven markets

Arc is a strong fit for prediction markets because forecasting products need reliable settlement, clean accounting, and clear market lifecycle guarantees.

## Core Features

- Institutional dark-mode market UI
- Market exploration and market detail pages
- Wallet connection with RainbowKit and wagmi
- Local MockUSDC approval flow
- Local buy YES / buy NO transaction flow
- Local claim payout transaction flow
- Resolver/admin dashboard
- Resolver-only local market resolution
- Mock fallback mode when contracts are not deployed
- Indexing-ready protocol event and entity model
- Foundry contracts and local Anvil workflow

## Architecture Overview

Probity is organized as a pnpm workspace monorepo:

```txt
apps/
  web/                 Next.js App Router frontend
contracts/            Foundry smart contracts and scripts
packages/
  ui/                  Shared UI package placeholder
  config/              Shared configuration package
  types/               Shared protocol, indexer, and domain types
deployments/          ABI and address artifacts by network
docs/                 Runbooks and development notes
scripts/              ABI export and workspace scripts
```

The frontend can run entirely with mock data, or it can read/write against local Anvil contracts when deployment artifacts are present.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- wagmi
- viem
- RainbowKit
- TanStack Query
- Foundry
- Anvil
- pnpm workspaces
- Vercel

## Smart Contracts

The Foundry contract layer includes:

- `MockUSDC`: local USDC-style ERC20 settlement token
- `MarketFactory`: creates and tracks prediction markets
- `PredictionMarket`: binary YES/NO market with fixed-price deposit accounting

Current MVP contract capabilities:

- Create YES/NO markets
- Buy YES shares
- Buy NO shares
- Track user positions
- Enforce market expiration
- Resolver-controlled resolution
- Claim pro-rata winnings
- Emit events for frontend/indexer consumption

The MVP does not include a production AMM, decentralized oracle, dispute system, or upgrade framework.

## Frontend

The frontend includes:

- Landing page
- `/markets` market board
- `/markets/[id]` market detail page
- `/portfolio` mock portfolio view
- `/create` mock market creation UI
- `/admin` resolver dashboard
- Web3 provider boundary
- Wallet connect button
- Local trading panel
- Local resolver operations
- Mock fallback for undeployed contracts

The app is designed so mock data, local contract reads, and future indexed data can share the same UI surface.

## Indexing-Ready Data Layer

Probity includes typed models for future indexing:

- Protocol events
- Market entities
- Trade history
- Position history
- Portfolio analytics
- Market snapshots
- Activity feed items
- Indexer adapter abstraction
- viem log parsing utilities

This is currently a frontend/shared-types architecture layer only. There is no production backend or database in this MVP.

## Local Development

Install dependencies:

```txt
pnpm install
```

Copy frontend environment defaults:

```txt
cp apps/web/.env.local.example apps/web/.env.local
```

Run the frontend:

```txt
pnpm --filter @probity/web dev
```

Default local frontend environment:

```txt
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEPLOYMENT_TARGET=local
NEXT_PUBLIC_MARKET_DATA_MODE=auto
```

`NEXT_PUBLIC_MARKET_DATA_MODE=auto` uses deployed local contracts when available and falls back to mock data otherwise.

## Local Blockchain Workflow

Start Anvil:

```txt
pnpm chain:local
```

Deploy local contracts, seed markets, and export ABIs:

```txt
pnpm contracts:bootstrap:local
```

Or run each step manually:

```txt
pnpm contracts:deploy:local
pnpm contracts:seed:local
pnpm contracts:export-abis
```

Deployment scripts write:

```txt
deployments/local/addresses.json
```

The frontend reads that file automatically unless explicit address environment variables are set.

## Foundry Commands

From the repository root:

```txt
pnpm --filter @probity/contracts build
pnpm --filter @probity/contracts test
pnpm --filter @probity/contracts format
```

From `contracts/` directly:

```txt
forge build
forge test
forge fmt
anvil --chain-id 31337 --block-time 1
```

Foundry must be installed locally for contract tests and Anvil workflows.

## Vercel Deployment

The frontend is deployed on Vercel from GitHub.

Recommended Vercel settings:

- Root/build target: `apps/web`
- Install command: `pnpm install`
- Build command: `pnpm --filter @probity/web build`
- Framework preset: Next.js

For deployed preview/demo environments, keep mock fallback enabled unless a public RPC and deployed contract addresses are configured:

```txt
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_DEPLOYMENT_TARGET=local
```

Local Anvil contracts are not available to Vercel-hosted users. The live deployment should be treated as a product/interface demo unless connected to a reachable testnet deployment.

## Demo Flow

Recommended MVP demo:

1. Open the landing page and explain Probity as Arc-ready stablecoin-native prediction market infrastructure.
2. Visit `/markets` to show the institutional market board and mock fallback behavior.
3. Start Anvil locally and run `pnpm contracts:bootstrap:local`.
4. Refresh `/markets` to show local contract-backed markets.
5. Open a market detail page and connect a wallet.
6. Approve MockUSDC.
7. Buy YES or NO shares.
8. Use `/admin` with the resolver wallet to resolve an expired local market.
9. Return to the market detail page and claim winnings when eligible.
10. Explain how emitted events map to the indexing-ready data layer.

## Current Limitations

- MVP/local-development protocol only
- No production oracle integration
- No dispute or challenge period
- No AMM or order book liquidity model
- No production database or hosted indexer
- No production compliance/KYC layer
- No audited smart contracts
- Local MockUSDC is not real USDC
- Vercel deployment is primarily a frontend/product demo unless connected to reachable deployed contracts

## Roadmap

- Arc testnet deployment configuration
- Hosted indexer or subgraph integration
- Real market creation flow
- Resolver evidence workflow
- Oracle/dispute module
- Portfolio analytics from indexed events
- Market liquidity upgrades
- Role-based admin access
- Compliance-oriented market metadata
- Security review and external audit
- Production deployment hardening

## Security Notes

Probity is not audited and should not be used with real funds.

The current contracts are intentionally simple for MVP clarity. Before any production use, the system needs:

- External smart contract audit
- Oracle and resolver threat modeling
- Reentrancy and payout edge-case review
- Access control review
- Market cancellation/dispute design
- Monitoring and incident response plan
- Formal deployment and key-management procedures

## License

License placeholder. Add the final project license before production or public reuse.
