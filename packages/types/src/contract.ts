export type HexAddress = `0x${string}`;
export type HexHash = `0x${string}`;

export type ChainRef = {
  chainId: number;
  network: "local" | "arc-testnet" | "arc-mainnet" | "unknown";
};

export type IndexedBlockRef = ChainRef & {
  blockHash?: HexHash;
  blockNumber: bigint;
  logIndex?: number;
  transactionHash: HexHash;
  transactionIndex?: number;
};

export type EntityId = string;
