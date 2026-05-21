import type { Market, MarketCategory, MarketStatus } from "@/features/markets/types";

export const marketCategories = ["All", "Macro", "Crypto", "Policy", "Arc", "Earnings"] as const;

export const marketStatuses = ["All", "active", "expired", "resolved"] as const;

// Mock data is deliberately shaped like indexed contract data so this module can
// later be replaced by an indexer/API adapter without changing page components.
export const mockMarkets: Market[] = [
  {
    id: "fed-cut-next-fomc",
    title: "Will the Fed cut rates at the next FOMC meeting?",
    description:
      "This market resolves YES if the Federal Open Market Committee announces a target rate cut at its next scheduled policy decision.",
    category: "Macro",
    status: "active",
    yesProbability: 64,
    volumeUsd: 18_420_000,
    liquidityUsd: 4_880_000,
    expiresAt: "2026-06-19T18:00:00.000Z",
    settlementToken: "USDC",
    resolver: "Probity Macro Desk",
    rules: [
      "YES if the target federal funds range is lowered at the next scheduled FOMC decision.",
      "NO if rates are held, raised, or no scheduled decision occurs before expiry.",
      "Resolution references the official Federal Reserve statement."
    ],
    outcome: null,
    participants: 12840,
    change24h: 3.2
  },
  {
    id: "eth-etf-weekly-inflows-1b",
    title: "Will spot ETH ETF weekly inflows exceed $1B this month?",
    description:
      "This market tracks aggregate reported net inflows across US spot ETH ETF products for any calendar week before expiry.",
    category: "Crypto",
    status: "active",
    yesProbability: 41,
    volumeUsd: 7_830_000,
    liquidityUsd: 2_140_000,
    expiresAt: "2026-06-26T23:59:59.000Z",
    settlementToken: "USDC",
    resolver: "Probity Crypto Desk",
    rules: [
      "YES if any reported calendar week shows more than $1B of net inflows.",
      "NO if no week exceeds the threshold before market expiry.",
      "Resolution uses public ETF flow reporting from recognized data providers."
    ],
    outcome: null,
    participants: 6420,
    change24h: -1.8
  },
  {
    id: "stablecoin-bill-committee",
    title: "Will a US stablecoin market structure bill pass committee?",
    description:
      "This market resolves based on whether a US congressional committee advances a stablecoin market structure bill before expiry.",
    category: "Policy",
    status: "active",
    yesProbability: 72,
    volumeUsd: 11_210_000,
    liquidityUsd: 3_320_000,
    expiresAt: "2026-07-07T23:59:59.000Z",
    settlementToken: "USDC",
    resolver: "Probity Policy Desk",
    rules: [
      "YES if a relevant stablecoin bill is formally reported out of committee.",
      "NO if the deadline passes without committee passage.",
      "Resolution references official congressional records."
    ],
    outcome: null,
    participants: 9354,
    change24h: 5.6
  },
  {
    id: "arc-usdc-gas-pilot",
    title: "Will Arc announce a public stablecoin gas pilot before Q3?",
    description:
      "This market focuses on public infrastructure announcements related to stablecoin-native gas or equivalent predictable settlement mechanics on Arc.",
    category: "Arc",
    status: "active",
    yesProbability: 58,
    volumeUsd: 4_960_000,
    liquidityUsd: 1_460_000,
    expiresAt: "2026-06-30T23:59:59.000Z",
    settlementToken: "USDC",
    resolver: "Probity Arc Desk",
    rules: [
      "YES if Arc or an official ecosystem channel announces a public gas pilot before expiry.",
      "NO if no qualifying public announcement is made before expiry.",
      "Ambiguous partner-only or private beta references do not qualify."
    ],
    outcome: null,
    participants: 3411,
    change24h: 1.1
  },
  {
    id: "btc-above-120k-quarter-end",
    title: "Will BTC close above $120K at quarter end?",
    description:
      "This market resolves against a defined BTC/USD reference price at the final daily close of the quarter.",
    category: "Crypto",
    status: "expired",
    yesProbability: 49,
    volumeUsd: 22_640_000,
    liquidityUsd: 5_010_000,
    expiresAt: "2026-05-15T23:59:59.000Z",
    settlementToken: "USDC",
    resolver: "Probity Crypto Desk",
    rules: [
      "YES if the BTC/USD reference close is above $120,000 at expiry.",
      "NO if the close is equal to or below $120,000.",
      "Resolution uses the selected institutional reference price."
    ],
    outcome: null,
    participants: 18752,
    change24h: 0
  },
  {
    id: "major-bank-tokenized-deposit",
    title: "Will a major US bank launch a tokenized deposit product this year?",
    description:
      "This market resolves on a public launch, not merely a pilot, of a tokenized deposit product by a US global systemically important bank.",
    category: "Macro",
    status: "active",
    yesProbability: 36,
    volumeUsd: 6_300_000,
    liquidityUsd: 1_870_000,
    expiresAt: "2026-12-31T23:59:59.000Z",
    settlementToken: "USDC",
    resolver: "Probity Macro Desk",
    rules: [
      "YES if a qualifying bank publicly launches a tokenized deposit product.",
      "NO if only research, pilots, or internal tests are announced.",
      "Resolution references official bank communications."
    ],
    outcome: null,
    participants: 5021,
    change24h: -2.4
  },
  {
    id: "nvidia-guidance-beat",
    title: "Will NVIDIA next-quarter revenue guidance exceed consensus?",
    description:
      "This market resolves based on whether NVIDIA's next reported revenue guidance exceeds consensus estimates immediately before earnings.",
    category: "Earnings",
    status: "resolved",
    yesProbability: 81,
    volumeUsd: 13_780_000,
    liquidityUsd: 0,
    expiresAt: "2026-05-10T20:00:00.000Z",
    settlementToken: "USDC",
    resolver: "Probity Earnings Desk",
    rules: [
      "YES if company revenue guidance exceeds pre-release consensus.",
      "NO if guidance is equal to or below consensus.",
      "Resolution references company filings and consensus snapshot."
    ],
    outcome: "yes",
    participants: 10221,
    change24h: 0
  },
  {
    id: "ecb-june-hold",
    title: "Will the ECB hold rates at its June policy meeting?",
    description:
      "This market resolves YES if the European Central Bank leaves its main policy rates unchanged at the June meeting.",
    category: "Macro",
    status: "active",
    yesProbability: 54,
    volumeUsd: 5_480_000,
    liquidityUsd: 1_250_000,
    expiresAt: "2026-06-04T13:45:00.000Z",
    settlementToken: "USDC",
    resolver: "Probity Macro Desk",
    rules: [
      "YES if the ECB leaves rates unchanged.",
      "NO if any main policy rate changes at the meeting.",
      "Resolution references the official ECB monetary policy decision."
    ],
    outcome: null,
    participants: 4168,
    change24h: 0.7
  }
];

export function getMarketById(id: string) {
  return mockMarkets.find((market) => market.id === id);
}

export function getMarketsByFilter(category: "All" | MarketCategory, status: "All" | MarketStatus) {
  return mockMarkets.filter((market) => {
    const categoryMatches = category === "All" || market.category === category;
    const statusMatches = status === "All" || market.status === status;

    return categoryMatches && statusMatches;
  });
}
