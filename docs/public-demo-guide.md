# Probity Public Demo Guide

## Live Demo

- App: https://probity-market.vercel.app
- Arc testnet RPC: https://rpc.testnet.arc.network
- Arc testnet chain ID: `5042002`
- Settlement token: Arc testnet USDC at `0x3600000000000000000000000000000000000000`
- MarketFactory: `0x7BCa73D2dD03924bDaC330D176760B09f17C1504`

## Faucet

Public demo users need Arc testnet USDC before trading.

Get testnet USDC from the Circle faucet:

https://faucet.circle.com/

For this demo, Arc testnet USDC is used for settlement and gas. It is testnet-only and should not be treated as mainnet USDC.

## External Signals

External Signals use public Polymarket Gamma metadata as reference data only.

Probity does not execute Polymarket trades and does not imply Polymarket affiliation. When an external reference is drafted into `/create`, the created market is an independent Arc-native Probity market with its own USDC settlement and resolver flow.

## Market Creation

Only wallets approved by the Probity MarketFactory can create markets from the public Create page. The selected resolver address must also be approved by the MarketFactory.

To approve the current demo creator wallet, set:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
MARKET_FACTORY_ADDRESS=0x7BCa73D2dD03924bDaC330D176760B09f17C1504
CREATOR_ADDRESS=0x303ACa77DE86EEFAe32d7C98DA4C3e836Cc4E46F
```

Then run:

```txt
pnpm contracts:approve-creator:arc-testnet
```

Never commit private keys or funded wallet secrets.
