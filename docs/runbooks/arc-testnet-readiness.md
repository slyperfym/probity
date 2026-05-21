# Arc Testnet Readiness

Probity is prepared for Arc testnet configuration, but production deployment is intentionally out of scope for the current MVP.

## Environment Variables

Configure these values in Vercel and local `.env` files when an Arc testnet RPC and deployed contract addresses are available:

```txt
NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_ARC_CHAIN_NAME=Arc Testnet
NEXT_PUBLIC_ARC_NATIVE_CURRENCY_NAME=
NEXT_PUBLIC_ARC_NATIVE_CURRENCY_SYMBOL=
NEXT_PUBLIC_ARC_BLOCK_EXPLORER_URL=
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

Use placeholders only in examples. Do not hardcode unofficial Arc testnet addresses in source.

## Settlement Token Strategy

Local development uses `MockUSDC`.

Arc testnet should use a USDC-style ERC20 settlement token:

- Prefer an official test USDC-style token if Arc provides one.
- If no official token exists, deploy a clearly named test ERC20 and document that it is not production USDC.
- Configure the token address as `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS`.
- Record the same address in `deployments/arc-testnet/addresses.json`.

## Deployment Artifact

Expected `deployments/arc-testnet/addresses.json` shape:

```json
{
  "chainId": 0,
  "deploymentBlock": 0,
  "contracts": {
    "MarketFactory": "0x...",
    "MockUSDC": "0x..."
  },
  "markets": [],
  "metadata": {
    "deployer": "0x...",
    "resolver": "0x...",
    "settlementTokenStrategy": "USDC-style test token",
    "mode": "arc-testnet"
  }
}
```

The `MockUSDC` key currently represents the configured settlement token address in frontend helpers. It may point to MockUSDC locally or a USDC-style test token on Arc testnet.

## Contract Deployment Path

1. Confirm official Arc testnet chain id, RPC URL, explorer URL, and native currency metadata.
2. Confirm settlement token strategy.
3. Deploy or select the USDC-style settlement token.
4. Deploy `MarketFactory`.
5. Approve the intended resolver address in `MarketFactory`.
6. Create seed markets if needed.
7. Export ABIs:

```txt
pnpm contracts:export-abis
```

8. Update `deployments/arc-testnet/addresses.json`.
9. Configure Vercel environment variables.
10. Redeploy the frontend.

## Vercel Checklist

- `NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet`
- `NEXT_PUBLIC_MARKET_DATA_MODE=auto`
- `NEXT_PUBLIC_CHAIN_ID` matches Arc testnet
- `NEXT_PUBLIC_RPC_URL` is reachable from browsers
- `NEXT_PUBLIC_ARC_CHAIN_NAME` is set
- `NEXT_PUBLIC_ARC_NATIVE_CURRENCY_NAME` is set
- `NEXT_PUBLIC_ARC_NATIVE_CURRENCY_SYMBOL` is set
- `NEXT_PUBLIC_ARC_BLOCK_EXPLORER_URL` is set when available
- `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` is set after deployment
- `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` is set after settlement token selection
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set for WalletConnect support

## Frontend Safety Behavior

The frontend warns users when:

- mock deployment target is active
- Arc testnet is selected but RPC still points to localhost
- Arc testnet is selected without contract addresses
- the connected wallet is on an unsupported chain

When contracts are missing or reads fail, Probity preserves mock fallback behavior instead of breaking the market UI.
