# Probity Demo Script

Probity is an institutional-grade prediction market MVP built for Arc. It is designed around stablecoin-native settlement, transparent onchain accounting, and deterministic market resolution.

On the landing page, we introduce Probity as forecasting infrastructure for markets like macro policy, crypto events, Arc ecosystem milestones, and earnings outcomes. The interface is intentionally professional and trading-focused rather than consumer-gamified.

From the markets page, users can browse binary YES/NO markets, filter by category or status, and inspect probability, volume, liquidity, expiration, and settlement token information. The public demo currently shows mock market data when Arc testnet contract addresses are not configured, which keeps the product experience stable for reviewers.

On a market detail page, users can see the resolution criteria, market signal, and trading panel. In local development, after deploying contracts to Anvil, users can connect a wallet with RainbowKit, approve MockUSDC, buy YES or NO shares, and later claim winnings after resolution.

The admin page demonstrates resolver operations. A resolver can review expired markets and, when using local deployed contracts, resolve outcomes as YES or NO. This models the deterministic settlement flow without adding a production oracle in the MVP.

Probity is also prepared for Arc testnet. The frontend supports Arc testnet configuration with chain ID 5042002 and RPC `https://rpc.testnet.arc.network`. Until deployed `MarketFactory` and settlement token addresses are provided, the app clearly displays demo mode: Arc Testnet Ready, Mock Data Active.

This is not production-ready or audited infrastructure yet. It is an MVP showing how institutional prediction markets on Arc can combine stablecoin settlement, transparent execution, local contract trading, resolver workflows, and an indexing-ready data architecture.
