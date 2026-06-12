# Arc Testnet Readiness

Probity is prepared for Arc testnet configuration, but production deployment is intentionally out of scope for the current MVP.

## Environment Variables

Configure these values in Vercel and local `.env` files when an Arc testnet RPC and deployed contract addresses are available:

```txt
NEXT_PUBLIC_DEPLOYMENT_TARGET=arc-testnet
NEXT_PUBLIC_MARKET_DATA_MODE=auto
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
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

- Use the Arc testnet USDC-style token address from official docs, the Circle faucet, an explorer, or user-provided configuration.
- Public demo users should obtain Arc testnet USDC from the Circle faucet before trading.
- Arc testnet uses USDC as the gas token, so users need testnet USDC for gas and market settlement.
- Do not deploy or configure MockUSDC for the Arc public demo path.
- Configure the token address as `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS`.
- Record the same address in `deployments/arc-testnet/addresses.json`.

## Deployment Artifact

Expected `deployments/arc-testnet/addresses.json` shape:

```json
{
  "chainId": 5042002,
  "deploymentBlock": 0,
  "contracts": {
    "MarketFactory": "0x...",
    "SettlementToken": "0x...",
    "MockUSDC": "0x..."
  },
  "markets": [],
  "metadata": {
    "deployer": "0x...",
    "resolver": "0x...",
    "settlementTokenStrategy": "configured-arc-testnet-USDC",
    "mode": "arc-testnet"
  }
}
```

The `SettlementToken` key is the preferred frontend settlement-token address. The legacy `MockUSDC` key is retained for compatibility with existing frontend helpers and local development artifacts.

## Contract Deployment Path

1. Confirm official Arc testnet chain id, RPC URL, explorer URL, and native currency metadata.
2. Confirm settlement token strategy.
3. Configure a dedicated testnet deployer wallet. Do not use a production or mainnet-funded private key.
4. Select the Arc testnet USDC settlement token address from official docs, faucet, explorer, or user-provided configuration.
5. Deploy `MarketFactory`.
6. Approve the intended resolver address in `MarketFactory`.
7. Approve the configured Arc Testnet settlement token in `MarketFactory`.
8. Create seed markets if needed.
9. Export ABIs:

```txt
pnpm contracts:export-abis
```

10. Update `deployments/arc-testnet/addresses.json`.
11. Configure Vercel environment variables.
12. Redeploy the frontend.

## Foundry Deployment Command

Arc testnet deployment uses `contracts/script/DeployArcTestnet.s.sol`.

Set environment variables in your shell or local `.env` workflow. Do not commit real secrets:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
RESOLVER_ADDRESS=0x...
SETTLEMENT_TOKEN_ADDRESS=0x...
SEED_DEMO_MARKETS=0
FORCE_SEED_MARKETS=0
```

`SETTLEMENT_TOKEN_ADDRESS` is required for Arc testnet deployment. It must point to an existing Arc testnet USDC-style contract. The Arc deployment script does not deploy MockUSDC.

`SEED_DEMO_MARKETS` defaults to `0`. Set it to `1` only when you want the Arc testnet deployment script to create three demo markets during deployment. These are presentation markets only; they do not add liquidity or execute trades automatically.

`FORCE_SEED_MARKETS` is only used by the standalone seed script. Leave it at `0` unless you intentionally want to create another set of demo markets on a factory that already has markets.

Run:

```txt
pnpm contracts:deploy:arc-testnet
pnpm contracts:export-abis
```

Or run both deployment and ABI export together:

```txt
pnpm contracts:bootstrap:arc-testnet
```

The deployment script writes:

```txt
deployments/arc-testnet/addresses.json
```

The script verifies it is running on chain id `5042002` before broadcasting.
It also calls `setSettlementTokenApproval(SETTLEMENT_TOKEN_ADDRESS, true)` on the fresh factory before optional seed market creation.

## New Deployment Requirement

The grant-readiness contract changes add cancellation, refunds, resolver evidence, and settlement-token whitelisting. These changes alter ABI and bytecode. A new `MarketFactory` deployment is required before enabling these capabilities in the frontend.

Existing Arc Testnet markets remain readable where their legacy ABI supports the requested fields, but they do not support `cancel()`, `claimRefund()`, `refundAmount(address)`, `resolutionEvidence()`, or evidence-required `resolve(outcome, evidenceURI)`. Do not advertise cancellation/refunds for legacy markets and do not silently point Vercel to an undeployed replacement factory.

## Seed Markets After Deployment

If the Arc testnet frontend connects to `MarketFactory` but displays zero contract markets, run the standalone seed script:

```txt
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
RESOLVER_ADDRESS=0x...
SETTLEMENT_TOKEN_ADDRESS=0x...
pnpm contracts:seed:arc-testnet
pnpm contracts:export-abis
```

The seed script:

- reads `deployments/arc-testnet/addresses.json`
- confirms chain id `5042002`
- uses `SETTLEMENT_TOKEN_ADDRESS` as the USDC settlement token
- approves the resolver on the existing factory
- approves `SETTLEMENT_TOKEN_ADDRESS` on the existing factory
- creates three demo markets only when `marketCount()` is zero
- writes the latest `factory.allMarkets()` array back to `deployments/arc-testnet/addresses.json`

After seeding, update Vercel only if contract addresses changed. If only the `markets` array changed, redeploying the frontend is optional because the app reads market addresses directly from `MarketFactory.allMarkets()`.

## Safety Notes

- Do not deploy from a wallet that holds production or mainnet funds.
- Do not commit `.env`, `.env.local`, private keys, or funded wallet secrets.
- Use a fresh test wallet for Arc testnet deployment.
- Use testnet funds only.
- Confirm `SETTLEMENT_TOKEN_ADDRESS` onchain before using an existing token.
- Tell public demo users to fund wallets with Arc testnet USDC from the Circle faucet before trading.
- Keep public demo fallback enabled until both `MarketFactory` and settlement token addresses are configured in Vercel.
- Treat resolver evidence as an auditable admin-submitted reference, not decentralized oracle output.
- Contracts are unaudited and testnet-only.

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
