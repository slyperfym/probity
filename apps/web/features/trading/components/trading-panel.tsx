"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { probityChain } from "@/config/chains";
import {
  contractAddresses,
  deploymentConfig,
  getPredictionMarketConfig,
  getSettlementTokenConfig,
  hasContractAddress
} from "@/config/contracts";
import {
  useMockUsdcAllowance,
  useMockUsdcBalance,
  usePredictionMarketPosition
} from "@/features/contracts/hooks";
import type { Market } from "@/features/markets/types";

const USDC_DECIMALS = 6;

export function TradingPanel({ market }: { market: Market }) {
  const [side, setSide] = React.useState<"YES" | "NO">("YES");
  const [amount, setAmount] = React.useState("1000");
  const queryClient = useQueryClient();
  const { address: accountAddress, chainId, isConnected } = useAccount();

  const isLocalContractMarket = isAddress(market.id) && hasContractAddress("MockUSDC");
  const marketAddress = isLocalContractMarket ? (market.id as Address) : undefined;
  const selectedProbability = side === "YES" ? market.yesProbability : 100 - market.yesProbability;
  const estimatedShares = Number(amount || 0) / Math.max(selectedProbability / 100, 0.01);
  const parsedAmount = parseTradeAmount(amount);
  const isMarketClosed = market.status === "expired" || market.status === "resolved";
  const tokenLabel = deploymentConfig.isArcTestnet ? "USDC" : "MockUSDC";
  const environmentLabel = deploymentConfig.isArcTestnet ? "Arc Testnet" : "Local Test";
  const configuredSettlementToken = contractAddresses.MockUSDC?.toLowerCase();
  const marketSettlementToken = market.settlementTokenAddress?.toLowerCase();
  const hasSettlementTokenMismatch = Boolean(
    deploymentConfig.isArcTestnet &&
      configuredSettlementToken &&
      marketSettlementToken &&
      configuredSettlementToken !== marketSettlementToken
  );

  const balanceQuery = useMockUsdcBalance(accountAddress);
  const allowanceQuery = useMockUsdcAllowance({
    ownerAddress: accountAddress,
    spenderAddress: marketAddress
  });
  const positionQuery = usePredictionMarketPosition({
    marketAddress,
    userAddress: accountAddress
  });

  const balance = (balanceQuery.data as bigint | undefined) ?? 0n;
  const allowance = (allowanceQuery.data as bigint | undefined) ?? 0n;
  const position = positionQuery.data as readonly [bigint, bigint, boolean] | undefined;
  const yesPosition = position?.[0] ?? 0n;
  const noPosition = position?.[1] ?? 0n;
  const hasClaimed = position?.[2] ?? false;
  const winningPosition = getWinningPosition(market.outcome, yesPosition, noPosition);
  const hasClaimablePosition = market.status === "resolved" && winningPosition > 0n && !hasClaimed;
  const hasEnoughAllowance = parsedAmount > 0n && allowance >= parsedAmount;
  const hasEnoughBalance = parsedAmount > 0n && balance >= parsedAmount;
  const isWrongChain = isConnected && chainId !== undefined && chainId !== probityChain.id;

  const approveWrite = useWriteContract();
  const buyWrite = useWriteContract();
  const claimWrite = useWriteContract();

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveWrite.data
  });
  const buyReceipt = useWaitForTransactionReceipt({
    hash: buyWrite.data
  });
  const claimReceipt = useWaitForTransactionReceipt({
    hash: claimWrite.data
  });

  React.useEffect(() => {
    if (approveReceipt.isSuccess || buyReceipt.isSuccess || claimReceipt.isSuccess) {
      void queryClient.invalidateQueries();
    }
  }, [approveReceipt.isSuccess, buyReceipt.isSuccess, claimReceipt.isSuccess, queryClient]);

  const isApproving = approveWrite.isPending || approveReceipt.isLoading;
  const isBuying = buyWrite.isPending || buyReceipt.isLoading;
  const isClaiming = claimWrite.isPending || claimReceipt.isLoading;
  const isWriting = isApproving || isBuying || isClaiming;
  const canAttemptLocalWrite =
    isLocalContractMarket &&
    isConnected &&
    Boolean(accountAddress) &&
    !isWrongChain &&
    !hasSettlementTokenMismatch &&
    parsedAmount > 0n &&
    !isMarketClosed &&
    hasEnoughBalance &&
    !isWriting;
  const canApprove = canAttemptLocalWrite && !hasEnoughAllowance;
  const canBuy = canAttemptLocalWrite && hasEnoughAllowance;
  const canClaim =
    isLocalContractMarket &&
    isConnected &&
    !isWrongChain &&
    market.status === "resolved" &&
    hasClaimablePosition &&
    !isWriting;
  const statusMessage = getStatusMessage({
    accountAddress,
    hasEnoughAllowance,
    hasEnoughBalance,
    hasClaimablePosition,
    isConnected,
    isLocalContractMarket,
    isMarketClosed,
    isWrongChain,
    parsedAmount,
    tokenLabel,
    hasSettlementTokenMismatch
  });

  React.useEffect(() => {
    const error = approveWrite.error ?? buyWrite.error ?? claimWrite.error;

    if (error) {
      console.error("Probity transaction error", {
        decoded: getFriendlyTransactionError(error),
        raw: error
      });
    }
  }, [approveWrite.error, buyWrite.error, claimWrite.error]);

  function handleApprove() {
    if (!marketAddress || parsedAmount <= 0n) {
      return;
    }

    approveWrite.writeContract({
      ...getSettlementTokenConfig(),
      args: [marketAddress, parsedAmount],
      functionName: "approve"
    });
  }

  function handleBuy() {
    if (!marketAddress || parsedAmount <= 0n) {
      return;
    }

    buyWrite.writeContract({
      ...getPredictionMarketConfig(marketAddress),
      args: [parsedAmount],
      functionName: side === "YES" ? "buyYes" : "buyNo"
    });
  }

  function handleClaim() {
    if (!marketAddress) {
      return;
    }

    claimWrite.writeContract({
      ...getPredictionMarketConfig(marketAddress),
      functionName: "claim"
    });
  }

  return (
    <Card className="bg-slate-950/90">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Trading Panel</CardTitle>
          <Badge variant={isLocalContractMarket ? "yes" : "info"}>
            {isLocalContractMarket ? environmentLabel : "Mock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 rounded-lg border border-amber-300/25 bg-amber-300/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            {deploymentConfig.isArcTestnet ? "Arc testnet trading" : "Local test trading only"}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {deploymentConfig.isArcTestnet
              ? "These actions use configured Arc testnet contracts and USDC settlement. Users need Arc testnet USDC from the Circle faucet before trading."
              : "These actions are intended for Anvil and MockUSDC. They are not a production trading flow and should only be used against locally deployed Probity contracts."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["YES", "NO"] as const).map((option) => (
            <Button
              key={option}
              onClick={() => setSide(option)}
              type="button"
              variant={side === option ? "outline" : "secondary"}
            >
              Buy {option}
            </Button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">
            Amount
          </span>
          <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.03] px-3">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              value={amount}
            />
            <span className="text-sm text-slate-500">USDC</span>
          </div>
        </label>

        <div className="mt-5 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
          <PreviewRow label="Selected side" value={side} />
          <PreviewRow
            label={isLocalContractMarket ? "Onchain probability" : "Mock probability"}
            value={`${selectedProbability}%`}
          />
          <PreviewRow
            label="Estimated shares"
            value={estimatedShares.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          />
          {isLocalContractMarket && (
            <>
              <PreviewRow label={`${tokenLabel} balance`} value={`${formatUsdc(balance)} USDC`} />
              <PreviewRow label="Market allowance" value={`${formatUsdc(allowance)} USDC`} />
              {market.settlementTokenAddress && (
                <PreviewRow label="Market token" value={shortAddress(market.settlementTokenAddress)} />
              )}
              <PreviewRow label="YES position" value={`${formatUsdc(yesPosition)} shares`} />
              <PreviewRow label="NO position" value={`${formatUsdc(noPosition)} shares`} />
              {market.status === "resolved" && (
                <PreviewRow
                  label="Claimable position"
                  value={`${formatUsdc(winningPosition)} shares`}
                />
              )}
              <PreviewRow label="Claim status" value={hasClaimed ? "Claimed" : "Not claimed"} />
            </>
          )}
        </div>

        {statusMessage && <TradingNotice message={statusMessage} />}
        <TransactionState
          error={approveWrite.error ?? buyWrite.error ?? claimWrite.error}
          isPending={isWriting}
          pendingHash={approveWrite.data ?? buyWrite.data ?? claimWrite.data}
          successMessage={
            approveReceipt.isSuccess
              ? "Approval confirmed."
              : buyReceipt.isSuccess
                ? `${side} purchase confirmed.`
                : claimReceipt.isSuccess
                  ? "Claim confirmed."
                  : ""
          }
        />

        <div className="mt-5 grid gap-3">
          {isLocalContractMarket ? (
            <>
              <Button disabled={!canApprove} onClick={handleApprove} type="button">
                {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve {tokenLabel}
              </Button>
              <Button disabled={!canBuy} onClick={handleBuy} type="button" variant="outline">
                {isBuying && <Loader2 className="h-4 w-4 animate-spin" />}
                Buy {side}
              </Button>
              <Button disabled={!canClaim} onClick={handleClaim} type="button" variant="secondary">
                {isClaiming && <Loader2 className="h-4 w-4 animate-spin" />}
                Claim Payout
              </Button>
            </>
          ) : (
            <Button disabled>Execute Mock Trade</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TradingNotice({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-cyan-400/25 bg-cyan-400/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
        <ShieldCheck className="h-4 w-4" />
        Trading guardrail
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

function TransactionState({
  error,
  isPending,
  pendingHash,
  successMessage
}: {
  error: Error | null | undefined;
  isPending: boolean;
  pendingHash: string | undefined;
  successMessage: string;
}) {
  if (!error && !isPending && !successMessage) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
      {isPending && (
        <div className="flex items-center gap-2 text-cyan-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            Waiting for wallet or chain confirmation
            {pendingHash ? ` (${shortAddress(pendingHash)})` : ""}...
          </span>
        </div>
      )}
      {successMessage && !isPending && (
        <div className="flex items-center gap-2 text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{getFriendlyTransactionError(error)}</span>
        </div>
      )}
    </div>
  );
}

function getStatusMessage({
  accountAddress,
  hasEnoughAllowance,
  hasEnoughBalance,
  hasClaimablePosition,
  isConnected,
  isLocalContractMarket,
  isMarketClosed,
  isWrongChain,
  parsedAmount,
  tokenLabel,
  hasSettlementTokenMismatch
}: {
  accountAddress: string | undefined;
  hasEnoughAllowance: boolean;
  hasEnoughBalance: boolean;
  hasClaimablePosition: boolean;
  isConnected: boolean;
  isLocalContractMarket: boolean;
  isMarketClosed: boolean;
  isWrongChain: boolean;
  parsedAmount: bigint;
  tokenLabel: string;
  hasSettlementTokenMismatch: boolean;
}) {
  if (!isLocalContractMarket) {
    return "This is mock fallback data, so contract writes remain disabled.";
  }

  if (!isConnected || !accountAddress) {
    return `Connect a wallet on ${probityChain.name} to approve ${tokenLabel}, buy shares, or claim payouts.`;
  }

  if (hasSettlementTokenMismatch) {
    return "This market was created with a different settlement token than the configured Arc testnet USDC. Redeploy or reseed markets with the current USDC token before trading.";
  }

  if (isWrongChain) {
    return `Switch your wallet to ${probityChain.name} (${probityChain.id}) before sending transactions.`;
  }

  if (isMarketClosed) {
    return hasClaimablePosition
      ? "Buying is disabled because this market is closed. You can claim the resolved winning position."
      : "Buying is disabled because this market is expired or resolved. Claiming is available only after resolution for winning positions.";
  }

  if (parsedAmount <= 0n) {
    return `Enter a positive ${tokenLabel} amount to trade.`;
  }

  if (!hasEnoughBalance) {
    return `Your connected wallet does not have enough ${tokenLabel} for this trade.`;
  }

  if (!hasEnoughAllowance) {
    return `Approve ${tokenLabel} for this market before buying YES or NO shares.`;
  }

  return "";
}

function parseTradeAmount(value: string) {
  try {
    return parseUnits(value || "0", USDC_DECIMALS);
  } catch {
    return 0n;
  }
}

function formatUsdc(value: bigint) {
  return Number(formatUnits(value, USDC_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function shortenError(value: string) {
  return value.length > 180 ? `${value.slice(0, 180)}...` : value;
}

function getFriendlyTransactionError(error: Error) {
  const raw = getErrorText(error);
  const selector = extractSelector(raw);

  if (selector) {
    const decoded = customErrorMessages[selector];

    if (decoded) {
      return decoded;
    }
  }

  if (raw.includes("User rejected") || raw.includes("User denied")) {
    return "Transaction was rejected in the wallet.";
  }

  return shortenError(raw);
}

function getErrorText(error: Error) {
  const details = [
    error.message,
    "shortMessage" in error ? String(error.shortMessage) : "",
    "details" in error ? String(error.details) : "",
    "cause" in error ? String(error.cause) : ""
  ];

  return details.filter(Boolean).join(" ");
}

function extractSelector(value: string) {
  return value.match(/0x[0-9a-fA-F]{8}/)?.[0]?.toLowerCase();
}

const customErrorMessages: Record<string, string> = {
  "0x045c4b02":
    "The settlement token transfer failed. Confirm the market was seeded with the configured USDC token and that your wallet has enough balance and allowance.",
  "0x13be252b":
    "The settlement token reported insufficient allowance. Approve this specific PredictionMarket contract as the spender, then retry.",
  "0x31be252b":
    "The settlement token reported an allowance-related failure. This usually means the market was seeded with a different token than the one approved in the UI.",
  "0xb521771a": "This market is not active or has already expired, so buying is disabled.",
  "0xcbca5aa2": "Enter an amount greater than zero before buying.",
  "0xf4d678b8": "The settlement token reported insufficient balance for this trade."
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getWinningPosition(
  outcome: Market["outcome"],
  yesPosition: bigint,
  noPosition: bigint
) {
  if (outcome === "yes") {
    return yesPosition;
  }

  if (outcome === "no") {
    return noPosition;
  }

  return 0n;
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
