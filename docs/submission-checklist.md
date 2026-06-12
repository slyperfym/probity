# Probity Submission Checklist

## Public Links

- Live demo: https://probity-market.vercel.app
- GitHub repository: https://github.com/slyperfym/probity

## Pages To Screenshot

- Landing page hero with live Arc Testnet positioning
- Market board at `/markets`
- Protocol evidence page at `/protocol-evidence`
- Market detail page at `/markets/[id]`
- Portfolio dashboard at `/portfolio`
- Create market workspace at `/create`
- Resolver admin dashboard at `/admin`

## Demo Flow Checklist

- Open the landing page and introduce Probity as institutional-grade prediction market infrastructure on Arc.
- Click **Explore Markets** and show category/status filtering on the market board.
- Open a market detail page and explain YES/NO probabilities, expiry, liquidity, volume, and resolution criteria.
- Show the trading panel and explain Arc Testnet settlement-token approvals and YES/NO buys.
- Open the wallet connection control and note that wallet support is configured with wagmi, viem, and RainbowKit.
- Visit the portfolio page to show positions, claimable rewards, and activity history.
- Visit the admin page to show resolver-controlled settlement and claimable market operations.
- Close by opening `/protocol-evidence` and verifying the active MarketFactory, settlement token, market count, and sample market Arcscan links.

## Arc Testnet Readiness Checklist

- Deployment target can be switched between mock, local, and Arc testnet modes.
- Arc testnet chain configuration uses chain ID `5042002`.
- Arc testnet RPC is configured as `https://rpc.testnet.arc.network` when enabled.
- No fake official contract addresses are hardcoded.
- Public app points reviewers to the active MarketFactory and settlement token through Protocol Evidence.
- README documents Arc testnet deployment steps and Vercel environment variables.

## Known Limitations

- Public Vercel demo is an MVP presentation environment, not a production trading venue.
- Arc Testnet contract addresses must remain consistent between deployment metadata and environment variables.
- Real oracle integration, production compliance workflows, and backend indexing are out of scope for this version.
- Local development can still use MockUSDC and Anvil-oriented workflows.

## Final Pre-Submit Checks

- Confirm `https://probity-market.vercel.app` loads successfully.
- Confirm browser title reads `Probity`.
- Confirm `/markets` focuses on trading and discovery without the protocol transparency widget.
- Confirm `/protocol-evidence` shows Arcscan links for the active deployment.
- Confirm navigation works for `/`, `/markets`, `/portfolio`, `/protocol-evidence`, `/create`, and `/admin`.
- Confirm README, submission summary, and demo script match the public demo state.
- Run web typecheck and build before submission.
- Do not commit real private keys, RPC secrets, or local `.env` files.
