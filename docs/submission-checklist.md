# Probity Submission Checklist

## Public Links

- Live demo: https://probity-market.vercel.app
- GitHub repository: https://github.com/slyperfym/probity

## Pages To Screenshot

- Landing page hero with demo status visible
- Market board at `/markets`
- Market detail page at `/markets/[id]`
- Portfolio dashboard at `/portfolio`
- Create market workspace at `/create`
- Resolver admin dashboard at `/admin`

## Demo Flow Checklist

- Open the landing page and introduce Probity as institutional-grade prediction market infrastructure on Arc.
- Click **Explore Markets** and show category/status filtering on the market board.
- Open a market detail page and explain YES/NO probabilities, expiry, liquidity, volume, and resolution criteria.
- Show the trading panel and explain that local MockUSDC trading is available in local development only.
- Open the wallet connection control and note that wallet support is configured with wagmi, viem, and RainbowKit.
- Visit the portfolio page to show positions, claimable rewards, and activity history.
- Visit the admin page to show resolver-controlled settlement and claimable market operations.
- Close by explaining Arc testnet readiness and the current mock fallback behavior.

## Arc Testnet Readiness Checklist

- Deployment target can be switched between mock, local, and Arc testnet modes.
- Arc testnet chain configuration uses chain ID `5042002`.
- Arc testnet RPC is configured as `https://rpc.testnet.arc.network` when enabled.
- No fake official contract addresses are hardcoded.
- Public demo keeps mock market data active until `MarketFactory` and settlement token addresses are configured.
- README documents Arc testnet deployment steps and Vercel environment variables.

## Known Limitations

- Public Vercel demo is an MVP presentation environment, not a production trading venue.
- Arc testnet contract addresses are not configured unless explicitly provided through environment variables.
- Mock market data remains active on the public demo when deployed contract addresses are missing.
- Real oracle integration, production compliance workflows, and backend indexing are out of scope for this version.
- Local trading uses MockUSDC and Anvil-oriented workflows.

## Final Pre-Submit Checks

- Confirm `https://probity-market.vercel.app` loads successfully.
- Confirm browser title reads `Probity`.
- Confirm the demo mode indicator shows **Demo Mode**, **Arc Testnet Ready**, and **Mock Data Active** when Arc testnet addresses are missing.
- Confirm navigation works for `/`, `/markets`, `/portfolio`, `/create`, and `/admin`.
- Confirm README, submission summary, and demo script match the public demo state.
- Run web typecheck and build before submission.
- Do not commit real private keys, RPC secrets, or local `.env` files.
