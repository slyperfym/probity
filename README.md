# Probity

Arc-native prediction market infrastructure with USDC-style settlement.

Probity is a working Arc Testnet MVP for binary YES/NO prediction markets. It demonstrates an end-to-end flow for browsing markets, connecting a wallet, trading with Arc testnet USDC, using an MVP sell-back mechanism, viewing portfolio positions, and resolving markets through an admin/resolver flow.

The project is built for stablecoin-native forecasting markets where settlement, market state, positions, and resolution are transparent onchain. The current deployment is a public testnet demo, not production financial infrastructure.

External Signals use public prediction market metadata only as reference material. Probity creates separate Arc-native markets through its own `MarketFactory`; it does not execute Polymarket trades and is not affiliated with Polymarket.

## Live Links

- Live demo: [https://probity-market.vercel.app](https://probity-market.vercel.app)
- GitHub: [https://github.com/slyperfym/probity](https://github.com/slyperfym/probity)
- Video demo: [https://youtu.be/EwQs5e_oorI?si=I6swYyHtJqOFeSC9](https://youtu.be/EwQs5e_oorI?si=I6swYyHtJqOFeSC9)
- Arc Testnet explorer: [https://testnet.arcscan.app](https://testnet.arcscan.app)
- Circle faucet: [https://faucet.circle.com](https://faucet.circle.com)

## Current Status

- Working Arc Testnet MVP
- Not production and not audited
- Public demo frontend deployed on Vercel
- Smart contracts deployed on Arc Testnet
- USDC-style settlement configured
- WalletConnect/mobile wallet support when a Reown Project ID is configured
- Approved creator market creation
- Resolver/admin resolution flow
- Cancellation and refund flow for unresolved markets in new deployments
- Settlement-token whitelist in `MarketFactory`
- External signal reference flow

## Features

- Arc Testnet wallet connection
- `MarketFactory`-based market creation
- YES/NO market browsing
- Buy YES / Buy NO
- MVP sell-back flow
- Portfolio tracking
- Claim payout after resolution
- Resolver/admin dashboard
- External Signals as reference metadata
- Local search and filtering

## Arc / Circle Integration

- Arc Testnet chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`
- Settlement token: `0x3600000000000000000000000000000000000000`
- MarketFactory: `0x7bca73d2dd03924bdac330d176760b09f17c1504`

Probity currently uses Arc Testnet and USDC-style settlement. Users need Arc testnet USDC for gas and trading in the demo. Circle Wallets, Paymaster, Gas Station, and other Circle Developer Platform products are future roadmap integrations; they are not currently live in this MVP.

## Deployed Contracts

MarketFactory:

```txt
0x7bca73d2dd03924bdac330d176760b09f17c1504
```

Settlement token:

```txt
0x3600000000000000000000000000000000000000
```

The `MarketFactory` creates individual `PredictionMarket` contracts used by the live Arc Testnet demo. Each `PredictionMarket` tracks YES/NO positions, settlement token balances, expiration, resolver-controlled outcomes, sell-back actions, claimable payouts, and, in new deployments, cancellation/refund state.

## How It Works

```txt
External Signals -> Draft Probity Market -> Approved Creator -> MarketFactory -> PredictionMarket -> USDC Trading -> Resolver Settlement -> Portfolio / Claim
```

External Signals are reference-only. They help approved creators draft market terms from public metadata, but the resulting Probity market is a separate Arc-native contract with independent USDC settlement and resolver-controlled resolution. Probity does not imply affiliation with or trading on Polymarket.

## Fund Safety Model

New `PredictionMarket` deployments support cancellation after expiration. The configured resolver can cancel an expired unresolved market. If the resolver is unavailable, the `MarketFactory` owner can cancel after the contract-defined unresolved grace period. Active, unexpired markets cannot be cancelled.

When a market is cancelled, buys, sells, normal resolution, and normal winning claims are disabled. Users can call `claimRefund()` to recover their remaining YES plus remaining NO shares. Refunds use current remaining balances, so shares sold before cancellation are not refundable. Refund accounting follows checks-effects-interactions and zeros user YES/NO balances before transferring settlement tokens.

Resolution remains the original simple resolver-controlled Arc MVP flow: the configured resolver finalizes YES or NO after expiration. Any source links or resolution criteria should be treated as supporting metadata, not as a decentralized oracle.

`MarketFactory` now uses an owner-managed settlement-token whitelist. New markets can only be created with approved settlement tokens. The deployment scripts approve the configured local MockUSDC or Arc Testnet settlement token immediately after deploying a fresh factory.

## Deployment Compatibility

The cancellation/refund/whitelist changes alter contract ABI and bytecode. A new `MarketFactory` deployment is required before the frontend should be pointed at these capabilities.

Existing Arc Testnet markets remain readable and resolvable through the original `resolve(outcome)` path. They do not implement `cancel()`, `claimRefund()`, or `refundAmount()`. Do not present old markets as refundable or cancellable. Do not silently point the frontend to a new undeployed factory address; update deployment artifacts and environment variables only after a real deployment.

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

## Local Development

Install dependencies:

```txt
pnpm install
```

Copy the environment template:

```txt
cp .env.example .env
```

Configure the Arc testnet variables you need, then run the web app:

```txt
pnpm dev
```

Useful validation commands:

```txt
pnpm typecheck
pnpm verify:phase1
pnpm verify:market-loading
pnpm verify:deployment:arc-testnet
pnpm build
node scripts/verify-market-loading-performance.mjs
```

`pnpm verify:deployment:arc-testnet` checks the Arc Testnet chain ID, MarketFactory bytecode, SettlementToken bytecode, non-zero market count, and sample market settlement token so frontend configuration drift is caught early.

Install Foundry before running contract tests or contract formatting checks:

```txt
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
```

Then run:

```txt
pnpm test:contracts
pnpm --filter @probity/contracts lint
forge fmt --check
forge test
```

Never commit `.env`, `.env.local`, private keys, or real deployment secrets.

## Environment Variables

Frontend/public variables:

```txt
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

Local deployment-only variables:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=
RESOLVER_ADDRESS=
CREATOR_ADDRESS=
MARKET_FACTORY_ADDRESS=
```

`NEXT_PUBLIC_*` values are exposed to the browser. Deployment-only variables are for local scripts and must not be committed.

## Known Limitations

- Testnet MVP only
- Not production
- Not financial advice
- No production oracle yet
- Resolver flow is controlled/admin-based
- Contracts are unaudited and testnet-only
- Legacy deployed markets do not support cancellation/refunds
- Participant indexing is being improved
- MVP sell-back is not a production CLOB or orderbook
- External Signals are reference metadata only
- Public market proposals are not fully enabled yet
- Smart contracts are not audited

## Roadmap

- Stabilize Arc Testnet MVP
- Improve USDC trading UX
- Improve mobile wallet onboarding
- Add reliable onchain indexing and analytics
- Improve participant and trade history indexing
- Expand creator and proposal workflows
- Improve resolver/oracle framework
- Explore Circle Wallets and Paymaster integrations

## Grant Context

Probity was prepared for Circle / Arc grant review as a working Arc Testnet MVP demonstrating stablecoin-native prediction market infrastructure. The current demo focuses on Arc-native market creation, USDC-style trading, transparent onchain settlement, resolver-admin resolution, and a credible path toward richer indexing, analytics, market proposals, and Circle Developer Platform integrations.

## Contributing

Contributions are welcome through issues and pull requests. Please keep changes scoped, document environment assumptions, and avoid committing generated secrets or local `.env` files.

## License

License to be finalized.
