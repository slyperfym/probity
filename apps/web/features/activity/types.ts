export type OnchainActivityKind =
  | "buy"
  | "sell"
  | "claim"
  | "resolve"
  | "create";

export type OnchainActivityItem = {
  action: string;
  amountLabel?: string;
  blockNumber: bigint;
  id: string;
  kind: OnchainActivityKind;
  marketAddress: `0x${string}`;
  marketTitle: string;
  status: "confirmed" | "pending";
  transactionHash: `0x${string}`;
};
