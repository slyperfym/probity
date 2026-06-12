# Probity Submission Summary

## Project

**Probity** is stablecoin-native prediction market infrastructure for institutional-grade forecasting on Arc.

- **Live demo:** [https://probity-market.vercel.app](https://probity-market.vercel.app)
- **GitHub:** [https://github.com/slyperfym/probity](https://github.com/slyperfym/probity)

## Problem

Prediction markets are useful for aggregating expectations around macro, crypto, policy, and market events, but institutional users need clearer settlement, transparent accounting, predictable stablecoin flows, and resolver workflows before these markets can feel credible.

## Solution

Probity provides a live Arc Testnet MVP for binary YES/NO markets with a professional market UI, wallet connection, Arc-native market contracts, resolver-controlled settlement, claimable payouts, and an indexing-ready data model.

## Why Arc

Arc is a strong fit because prediction markets benefit from stablecoin-native settlement, predictable execution costs, transparent onchain accounting, and clean infrastructure boundaries for trading, resolution, and indexing.

## Core Features

- Market discovery and market detail pages
- RainbowKit wallet connection
- Arc Testnet settlement-token approval and trading UX
- YES/NO position accounting
- Resolver/admin dashboard
- Claim payout flow after resolution
- Live Arc Testnet configuration and deployment metadata
- Indexing-ready event/entity architecture

## Smart Contract Architecture

- `MockUSDC`: local USDC-style settlement token
- `MarketFactory`: market deployment and registry
- `PredictionMarket`: YES/NO share accounting, expiration, resolver-controlled resolution, and pro-rata payout claims

The contracts are MVP-simple and not audited.

## Frontend Architecture

The frontend uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style local components, wagmi, viem, RainbowKit, and TanStack Query. It supports mock data, local contract reads/writes, and future indexed data through modular feature folders.

## Indexing/Data Architecture

Probity includes typed protocol events, market entities, trade history models, position history models, market snapshots, portfolio analytics, viem log parsing utilities, and a placeholder indexer adapter for future subgraph or custom indexer integration.

## Arc Testnet Readiness

Probity is live on Arc Testnet with chain ID `5042002`, RPC `https://rpc.testnet.arc.network`, active deployment metadata, and visible Protocol Evidence links for reviewers.

## Current MVP Limitations

- Not production-ready
- Not audited
- No production oracle
- No dispute system
- No AMM or order book
- No hosted indexer/database yet
- Testnet-only settlement and resolver-controlled MVP flow
- Hosted indexing/database remains future work

## Roadmap

- Continue hardening the Arc Testnet deployment
- Add hosted event indexer
- Add real market creation flow
- Keep resolver workflow simple while improving fund-safety controls
- Add oracle/dispute module
- Improve portfolio analytics from indexed events
- Add production security review and audit

## Demo Walkthrough

1. Open the live demo and introduce Probity as Arc-ready prediction market infrastructure.
2. Show the institutional landing page.
3. Browse markets on `/markets`.
4. Open a market detail page and explain YES/NO probabilities.
5. Explain wallet connection and Arc Testnet settlement-token trading.
6. Show the admin resolver dashboard.
7. Open `/protocol-evidence` and verify the MarketFactory, settlement token, market count, and sample market Arcscan links.

## Technical Highlights

- Full-stack monorepo with frontend, contracts, shared types, deployment artifacts, and docs
- Foundry contract workflow for local and Arc testnet deployment
- Live Arc Testnet approve, buy, resolve, and claim flows
- Professional MVP UX with transparent deployment evidence
- Clean separation between protocol events, frontend state, and future indexing
