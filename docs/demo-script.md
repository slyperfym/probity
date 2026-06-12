# Probity Demo Script

Probity is an institutional-grade prediction market MVP built for Arc. It is designed around stablecoin-native settlement, transparent onchain accounting, and deterministic market resolution.

On the landing page, we introduce Probity as forecasting infrastructure for markets like macro policy, crypto events, Arc ecosystem milestones, and earnings outcomes. The interface is intentionally professional and trading-focused rather than consumer-gamified.

From the markets page, users can browse live Arc Testnet binary YES/NO markets, filter by category or status, and inspect probability, volume, liquidity, expiration, and settlement token information. The Markets page also exposes the active MarketFactory, settlement token, chain ID, and current market count for reviewer verification.

On a market detail page, users can see the resolution criteria, market signal, and trading panel. On Arc Testnet, users can connect a wallet with RainbowKit, approve the configured settlement token, buy YES or NO shares, and later claim winnings after resolver settlement.

The admin page demonstrates resolver operations. A resolver can review expired markets and resolve outcomes as YES or NO. This models the deterministic settlement flow without adding a production oracle in the MVP.

Probity is live on Arc Testnet with chain ID 5042002, RPC `https://rpc.testnet.arc.network`, and the active MarketFactory documented in the README and deployment metadata.

This is not production-ready or audited infrastructure yet. It is an MVP showing how institutional prediction markets on Arc can combine stablecoin settlement, transparent execution, local contract trading, resolver workflows, and an indexing-ready data architecture.
