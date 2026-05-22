# Probity

Stablecoin-native prediction market infrastructure for institutional-grade forecasting on Arc.

**Live demo:** [https://probity-market.vercel.app](https://probity-market.vercel.app)  
**GitHub repository:** [https://github.com/slyperfym/probity](https://github.com/slyperfym/probity)

Probity is a prediction market MVP designed around transparent onchain execution, deterministic resolver-controlled settlement, and a professional trading interface. It combines a Next.js frontend, Foundry contracts, Arc testnet wallet connectivity, USDC-style trading flows, resolver/admin operations, approved-creator market creation, and an indexing-ready data model.

The project is built as an Arc Testnet protocol prototype. It is suitable for grant, hackathon, and ecosystem review, but it is not production-ready financial infrastructure.

## Status

- **MVP:** live Arc testnet demo with onchain market reads/writes
- **Live deployment:** Vercel demo at [https://probity-market.vercel.app](https://probity-market.vercel.app)
- **Arc testnet:** configured for chain ID `5042002`, RPC `https://rpc.testnet.arc.network`, and USDC-style settlement
- **Onchain flows:** deployed `MarketFactory`, approved creator market creation, YES/NO trading, portfolio reads, and resolver/admin resolution
- **Fallback:** mock fallback remains available when contract addresses or RPC access are not configured
- **Production readiness:** not production-ready, not audited, and not intended for real funds

## Product Overview

Probity lets users browse binary YES/NO forecasting markets, inspect market probability and liquidity, connect a wallet, trade with Arc testnet USDC, and claim payouts after resolver-controlled resolution. Resolver operators can review expired markets and resolve them YES or NO through the admin dashboard.

Approved creator wallets can create Arc-native Probity markets through the configured `MarketFactory`. External Signals use public prediction market metadata only as reference material for drafting market terms; Probity does not execute Polymarket trades and is not affiliated with Polymarket.

The MVP is intentionally scoped around clear protocol mechanics rather than AMM complexity or production oracle infrastructure. It demonstrates the full product loop:

- Create Arc-native markets through `MarketFactory`
- Buy YES or NO shares with Arc testnet USDC-style settlement
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

## Circle / Arc Integration

Probity is designed around Arc testnet and USDC-style settlement.

- Arc Testnet chain ID: `5042002`
- Native currency symbol: `USDC`
- RPC: `https://rpc.testnet.arc.network`
- Block explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com/`
- Settlement model: users approve and trade with the configured Arc testnet USDC-style token
- Market creation: approved creator wallets call the configured `MarketFactory`
- Resolution: approved resolver/admin flow resolves expired markets onchain
- Mobile wallets: RainbowKit, wagmi, viem, and WalletConnect/Reown Project ID support when configured

USDC settlement is central to the product thesis: prediction market users need predictable collateral accounting, clear payout mechanics, and a settlement asset that maps cleanly to institutional workflows. In the current MVP, this is demonstrated with Arc testnet USDC only.

## Core Features

- Institutional dark-mode market UI
- Market exploration and market detail pages
- Wallet connection with RainbowKit and wagmi
- Arc testnet USDC approval flow
- Arc testnet buy YES / buy NO transaction flow
- Claim payout transaction flow
- Approved creator market creation from `/create`
- External Signals discovery using public reference metadata
- Deduplication between external references and existing Probity markets
- Resolver/admin dashboard
- Resolver-only market resolution
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

The frontend can run entirely with mock data, or it can read/write against local Anvil contracts when deployment artifacts are present. Arc testnet mode is configuration-ready and shows mock data until deployed testnet contract addresses are configured.

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
- Sell YES or NO shares back to the market pool before expiry using conservative MVP pool-implied pricing
- Track user positions
- Enforce market expiration
- Resolver-controlled resolution
- Claim pro-rata winnings
- Emit events for frontend/indexer consumption

The MVP sell-back mechanism is not a production CLOB, orderbook, or Polymarket-style matching engine. Existing deployed Arc testnet markets must be redeployed from the updated contracts before they support `sellYes` and `sellNo`.

The MVP does not include a production AMM, decentralized oracle, dispute system, or upgrade framework.

## Frontend

The frontend includes:

- Landing page
- `/markets` market board
- `/markets/[id]` market detail page
- `/portfolio` wallet-aware portfolio view
- `/create` approved-creator market creation UI
- `/admin` resolver dashboard
- Web3 provider boundary
- Wallet connect button
- Arc testnet trading panel
- Resolver operations
- Mock fallback for undeployed contracts
- External Signals reference feed

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

The frontend is deployed on Vercel from GitHub:

- Live demo: [https://probity-market.vercel.app](https://probity-market.vercel.app)
- Repository: [https://github.com/slyperfym/probity](https://github.com/slyperfym/probity)

Recommended Vercel settings:

- Root/build target: `apps/web`
- Install command: `pnpm install`
- Build command: `pnpm --filter @probity/web build`
- Framework preset: Next.js

For deployed preview/demo environments, keep mock fallback enabled unless a public RPC and deployed contract addresses are configured:

```txt
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet
```

Local Anvil contracts are not available to Vercel-hosted users. The live deployment should be treated as a product/interface demo unless connected to a reachable Arc testnet deployment.

## Arc Testnet Deployment Path

Probity is Arc testnet-ready at the configuration and deployment-workflow layer, but deployed Arc testnet contract addresses are not assumed. If `MarketFactory` and settlement token addresses are missing, the public demo intentionally remains in mock-data mode.

Arc testnet configuration is environment-driven:

```txt
NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_NAME=Arc Testnet
NEXT_PUBLIC_ARC_NATIVE_CURRENCY_NAME=USD Coin
NEXT_PUBLIC_ARC_NATIVE_CURRENCY_SYMBOL=USDC
NEXT_PUBLIC_ARC_BLOCK_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

Do not hardcode private keys or unofficial token addresses in source. Use `.env.example` as the template and update Vercel environment variables once deployed Arc testnet contract addresses are available.

### Mobile Wallet Connection

Probity uses RainbowKit, wagmi, and WalletConnect/Reown for mobile wallet QR and deep-link connection flows. Set the Project ID in local `.env.local` and in Vercel:

```txt
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your Reown project id>
```

When this value is present, the wallet modal includes mobile-friendly WalletConnect options such as Rainbow, Coinbase Wallet, OKX, MetaMask, and the generic WalletConnect QR flow. When it is missing, Probity keeps injected browser wallets working and shows a non-blocking developer warning instead of crashing the app.

For Vercel, add the same variable under Project Settings -> Environment Variables for Production and Preview deployments, then redeploy the frontend.

Settlement token strategy:

- Local development uses `MockUSDC`.
- Arc testnet demos should use the configured Arc testnet USDC-style settlement token.
- Public demo wallets should obtain Arc testnet USDC from the Circle faucet before trading.
- Arc testnet uses USDC as the gas token, so users need testnet USDC for both gas and settlement.
- The USDC token address must come from official docs, a faucet, an explorer, or user-provided configuration.
- Circle faucet: https://faucet.circle.com/

Deployment artifact path:

```txt
deployments/arc-testnet/addresses.json
```

Detailed checklist:

```txt
docs/runbooks/arc-testnet-readiness.md
```

Arc testnet contract deployment uses Foundry:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
RESOLVER_ADDRESS=0x...
SETTLEMENT_TOKEN_ADDRESS=0x...
SEED_DEMO_MARKETS=0
FORCE_SEED_MARKETS=0

pnpm contracts:deploy:arc-testnet
pnpm contracts:export-abis
```

`SETTLEMENT_TOKEN_ADDRESS` is required for Arc testnet deployment and must point to the Arc testnet USDC-style token you intend to use. The Arc deploy script does not deploy MockUSDC. Set `SEED_DEMO_MARKETS=1` only if you want the deployment to create three presentation markets. Never commit real private keys or `.env` files.

If contracts are already deployed but the market board shows zero contract markets, seed the existing factory:

```txt
SETTLEMENT_TOKEN_ADDRESS=0x...
pnpm contracts:seed:arc-testnet
pnpm contracts:export-abis
```

The seed command reads `deployments/arc-testnet/addresses.json`, uses the configured USDC settlement token, creates demo markets only when `marketCount()` is zero, and writes the latest market list back to the deployment artifact. Set `FORCE_SEED_MARKETS=1` only when intentionally creating another set of demo markets.

Approve an Arc testnet market creator wallet:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
MARKET_FACTORY_ADDRESS=0x7BCa73D2dD03924bDaC330D176760B09f17C1504
CREATOR_ADDRESS=0x303ACa77DE86EEFAe32d7C98DA4C3e836Cc4E46F

pnpm contracts:approve-creator:arc-testnet
```

This calls `MarketFactory.setCreatorApproval(CREATOR_ADDRESS, true)`. Never commit real private keys or `.env` files. See `docs/public-demo-guide.md` for the public demo checklist.

To deploy and refresh ABI artifacts in one step:

```txt
pnpm contracts:bootstrap:arc-testnet
```

## Reviewer Demo

- Live demo: [https://probity-market.vercel.app](https://probity-market.vercel.app)
- GitHub: [https://github.com/slyperfym/probity](https://github.com/slyperfym/probity)

Suggested reviewer path:

1. Open the live demo and confirm the header shows the Arc testnet onchain demo state.
2. Connect an Arc testnet wallet through RainbowKit. WalletConnect mobile options are available when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is configured.
3. Get Arc testnet USDC from the Circle faucet: [https://faucet.circle.com/](https://faucet.circle.com/).
4. Visit `/markets` to browse seeded onchain markets and inspect External Signals.
5. Open a market detail page and review probability, expiry, settlement token, and resolver criteria.
6. Approve Arc testnet USDC and buy YES or NO shares.
7. Visit `/portfolio` to view live onchain positions for the connected wallet.
8. Use `/create` with an approved creator wallet to draft or create an Arc-native market, including from an External Signal reference.
9. Use `/admin` with the resolver wallet to resolve eligible expired markets and make winning positions claimable.
10. Explain that External Signals are reference metadata only. Probity does not execute Polymarket trades and has no Polymarket affiliation.

## Demo Flow

Recommended MVP demo:

1. Open the landing page and explain Probity as Arc-ready stablecoin-native prediction market infrastructure.
2. Visit `/markets` to show the institutional market board and mock fallback behavior.
3. Start Anvil locally and run `pnpm contracts:bootstrap:local`.
4. Refresh `/markets` to show local contract-backed markets.
5. Open a market detail page and connect a wallet.
6. Approve USDC on Arc testnet, or MockUSDC in local Anvil development.
7. Buy YES or NO shares.
8. Use `/admin` with the resolver wallet to resolve an expired local market.
9. Return to the market detail page and claim winnings when eligible.
10. Explain how emitted events map to the indexing-ready data layer.

## Grant Roadmap

Milestone 1: Harden Arc Testnet market creation and resolver approval flow

- Improve creator/resolver role management UX
- Add clearer admin runbooks and approval transaction history
- Expand contract tests around creator and resolver permissions

Milestone 2: Improve USDC settlement UX and mobile onboarding

- Add richer faucet guidance, balance checks, and network switching affordances
- Improve mobile wallet QA across WalletConnect/Reown, MetaMask, Rainbow, OKX, and Coinbase Wallet
- Make settlement-token state clearer across trading, portfolio, and claim flows

Milestone 3: Add public market proposal queue and external signal curation

- Add a proposal workflow for non-approved public users
- Add moderation/curation states for external signal references
- Keep onchain creation restricted to approved creators until spam and quality controls exist

Milestone 4: Add indexing, analytics, and activity feeds

- Stand up a hosted indexer or subgraph-style service
- Add historical trades, portfolio PnL, market snapshots, and resolver activity
- Replace frontend-only derived analytics with indexed data

Milestone 5: Add oracle/resolution framework and explore Circle Paymaster/Gas Station or Wallet integrations

- Design resolver evidence and challenge flows
- Explore oracle integrations for deterministic market resolution
- Investigate Circle Paymaster/Gas Station or Wallet integrations for smoother USDC-native onboarding

## Current Limitations

- Testnet MVP only
- Not production financial infrastructure
- Not financial advice
- No production oracle integration
- Resolver/admin flow is controlled and not decentralized
- No dispute or challenge period
- No AMM or order book liquidity model
- No production database or hosted indexer
- No production compliance/KYC layer
- No audited smart contracts
- Public market proposals are not enabled yet
- External Signals are reference metadata only
- No Polymarket trading or Polymarket affiliation
- Local MockUSDC is not real USDC and is only for Anvil development
- Arc testnet trading requires configured USDC settlement and user-funded testnet USDC wallets
- Vercel deployment is a public Arc testnet demo, not a production deployment

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
