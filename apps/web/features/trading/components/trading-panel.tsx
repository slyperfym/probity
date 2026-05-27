"use client";

import * as React from "react";
import Link from "next/link";
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
import { refreshOnchainQueries } from "@/lib/onchain-cache";

const USDC_DECIMALS = 6;
const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";
const QUICK_AMOUNTS = [1, 5, 10, 100] as const;

export function TradingPanel({ market }: { market: Market }) {
  const [mode, setMode] = React.useState<"buy" | "sell">("buy");
  const [side, setSide] = React.useState<"YES" | "NO">("YES");
  const [amount, setAmount] = React.useState("");
  const [lastAction, setLastAction] = React.useState<"approve" | "buy" | "sellYes" | "sellNo" | "claim" | null>(null);
  const [isRefreshingOnchainData, setIsRefreshingOnchainData] = React.useState(false);
  const queryClient = useQueryClient();
  const { address: accountAddress, chainId, isConnected } = useAccount();

  const isLocalContractMarket = isAddress(market.id) && hasContractAddress("MockUSDC");
  const marketAddress = isLocalContractMarket ? (market.id as Address) : undefined;
  const selectedProbability = side === "YES" ? market.yesProbability : 100 - market.yesProbability;
  const estimatedShares = Number(amount || 0) / Math.max(selectedProbability / 100, 0.01);
  const estimatedYesSellPayout = Number(amount || 0) * (market.yesProbability / 100);
  const estimatedNoSellPayout = Number(amount || 0) * ((100 - market.yesProbability) / 100);
  const parsedAmount = parseTradeAmount(amount);
  const hasEnteredAmount = parsedAmount > 0n;
  const isMarketClosed = market.status === "expired" || market.status === "resolved";
  const tokenLabel = deploymentConfig.isArcTestnet ? "USDC" : "Local USDC";
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
  const hasEnoughYesToSell = parsedAmount > 0n && yesPosition >= parsedAmount;
  const hasEnoughNoToSell = parsedAmount > 0n && noPosition >= parsedAmount;
  const isWrongChain = isConnected && chainId !== undefined && chainId !== probityChain.id;

  const approveWrite = useWriteContract();
  const buyWrite = useWriteContract();
  const sellWrite = useWriteContract();
  const claimWrite = useWriteContract();

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveWrite.data
  });
  const buyReceipt = useWaitForTransactionReceipt({
    hash: buyWrite.data
  });
  const sellReceipt = useWaitForTransactionReceipt({
    hash: sellWrite.data
  });
  const claimReceipt = useWaitForTransactionReceipt({
    hash: claimWrite.data
  });

  React.useEffect(() => {
    if (approveReceipt.isSuccess || buyReceipt.isSuccess || sellReceipt.isSuccess || claimReceipt.isSuccess) {
      setIsRefreshingOnchainData(true);
      void refreshOnchainQueries(queryClient).finally(() => setIsRefreshingOnchainData(false));
    }
  }, [approveReceipt.isSuccess, buyReceipt.isSuccess, sellReceipt.isSuccess, claimReceipt.isSuccess, queryClient]);

  const isApproving = approveWrite.isPending || approveReceipt.isLoading;
  const isBuying = buyWrite.isPending || buyReceipt.isLoading;
  const isSelling = sellWrite.isPending || sellReceipt.isLoading;
  const isClaiming = claimWrite.isPending || claimReceipt.isLoading;
  const isWriting = isApproving || isBuying || isSelling || isClaiming;
  const canAttemptBuy =
    isLocalContractMarket &&
    isConnected &&
    Boolean(accountAddress) &&
    !isWrongChain &&
    !hasSettlementTokenMismatch &&
    parsedAmount > 0n &&
    !isMarketClosed &&
    hasEnoughBalance &&
    !isWriting;
  const canAttemptSell =
    isLocalContractMarket &&
    isConnected &&
    Boolean(accountAddress) &&
    !isWrongChain &&
    !hasSettlementTokenMismatch &&
    parsedAmount > 0n &&
    !isMarketClosed &&
    !isWriting;
  const canApprove = canAttemptBuy && !hasEnoughAllowance;
  const canBuy = canAttemptBuy && hasEnoughAllowance;
  const canSellYes = canAttemptSell && hasEnoughYesToSell;
  const canSellNo = canAttemptSell && hasEnoughNoToSell;
  const canSellSelectedSide = side === "YES" ? canSellYes : canSellNo;
  const canClaim =
    isLocalContractMarket &&
    isConnected &&
    !isWrongChain &&
    market.status === "resolved" &&
    hasClaimablePosition &&
    !isWriting;
  const statusMessage = getStatusMessage({
    accountAddress,
    hasClaimed,
    hasEnoughAllowance,
    hasEnoughBalance,
    hasClaimablePosition,
    hasWinningPosition: winningPosition > 0n,
    isConnected,
    isLocalContractMarket,
    isMarketClosed,
    isWrongChain,
    marketStatus: market.status,
    mode,
    parsedAmount,
    hasSettlementTokenMismatch,
    tokenLabel
  });
  const shouldShowFaucetLink =
    deploymentConfig.isArcTestnet &&
    isLocalContractMarket &&
    isConnected &&
    !isMarketClosed &&
    parsedAmount > 0n &&
    !hasEnoughBalance;
  const selectedSellEstimate = side === "YES" ? estimatedYesSellPayout : estimatedNoSellPayout;
  const primaryAction = getPrimaryAction({
    canApprove,
    canBuy,
    canSellSelectedSide,
    hasEnteredAmount,
    hasEnoughAllowance,
    isApproving,
    isBuying,
    isSelling,
    mode,
    side,
    tokenLabel
  });
  const sellPositionMessage =
    mode === "sell" &&
    isLocalContractMarket &&
    isConnected &&
    !isWrongChain &&
    !hasSettlementTokenMismatch &&
    !isMarketClosed &&
    parsedAmount > 0n &&
    !canSellSelectedSide
      ? `You do not have enough ${side} shares to sell this amount.`
      : "";

  React.useEffect(() => {
    const error = approveWrite.error ?? buyWrite.error ?? sellWrite.error ?? claimWrite.error;

    if (error) {
      console.error("Probity transaction error", {
        decoded: getFriendlyTransactionError(error),
        raw: error
      });
    }
  }, [approveWrite.error, buyWrite.error, sellWrite.error, claimWrite.error]);

  function handleApprove() {
    if (!marketAddress || parsedAmount <= 0n) {
      return;
    }

    approveWrite.writeContract({
      ...getSettlementTokenConfig(),
      args: [marketAddress, parsedAmount],
      functionName: "approve"
    });
    setLastAction("approve");
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
    setLastAction("buy");
  }

  function handleSell(sellSide: "YES" | "NO") {
    if (!marketAddress || parsedAmount <= 0n) {
      return;
    }

    sellWrite.writeContract({
      ...getPredictionMarketConfig(marketAddress),
      args: [parsedAmount],
      functionName: sellSide === "YES" ? "sellYes" : "sellNo"
    });
    setLastAction(sellSide === "YES" ? "sellYes" : "sellNo");
  }

  function handleClaim() {
    if (!marketAddress) {
      return;
    }

    claimWrite.writeContract({
      ...getPredictionMarketConfig(marketAddress),
      functionName: "claim"
    });
    setLastAction("claim");
  }

  function incrementAmount(increment: number) {
    const currentAmount = Number(amount || 0);
    const nextAmount = Number.isFinite(currentAmount) ? currentAmount + increment : increment;

    setAmount(formatAmountInput(nextAmount));
  }

  function handleMaxAmount() {
    setAmount(formatUnits(balance, USDC_DECIMALS));
  }

  return (
    <Card className="bg-slate-950/88">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-slate-100">Trade</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Arc-native YES/NO position entry.</p>
          </div>
          <Badge className="border-white/10 bg-white/[0.03] text-slate-300" variant={isLocalContractMarket ? "yes" : "info"}>
            {isLocalContractMarket ? environmentLabel : "Unavailable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3.5 p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="rounded-lg border border-amber-300/12 bg-amber-300/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-100/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            {deploymentConfig.isArcTestnet ? "Arc testnet trading" : "Local test trading"}
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {deploymentConfig.isArcTestnet
              ? "Arc testnet USDC is used for gas and settlement. Sell-back is MVP pool pricing, not an orderbook."
              : "Use local contracts and local settlement tokens only. Sell-back is MVP pool pricing, not an orderbook."}
          </p>
        </div>

        <section className="space-y-2.5">
          <SectionLabel>Mode</SectionLabel>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-white/[0.06] bg-white/[0.014] p-1">
            {(["buy", "sell"] as const).map((option) => (
              <button
                className={[
                  "h-10 rounded-[5px] text-sm font-medium capitalize transition sm:h-9",
                  mode === option
                    ? "bg-white/[0.07] text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                ].join(" ")}
                key={option}
                onClick={() => setMode(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionLabel>Side</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
          {(["YES", "NO"] as const).map((option) => (
              <button
                className={[
                  "h-11 rounded-md border px-3 text-sm font-medium transition sm:h-10",
                  side === option
                    ? option === "YES"
                      ? "border-emerald-300/35 bg-emerald-400/[0.08] text-emerald-100"
                      : "border-rose-300/35 bg-rose-400/[0.08] text-rose-100"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200"
                ].join(" ")}
                key={option}
                onClick={() => setSide(option)}
                type="button"
              >
                {option}
              </button>
          ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Amount</SectionLabel>
            {isLocalContractMarket && (
              <span className="text-xs text-slate-600">Balance {formatUsdc(balance)} {tokenLabel}</span>
            )}
          </div>
          <div className="flex h-12 items-center rounded-md border border-white/[0.08] bg-white/[0.025] px-3 transition focus-within:border-cyan-300/25">
            <input
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-100 outline-none placeholder:text-slate-700"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              value={amount}
            />
            <span className="text-sm text-slate-500">{tokenLabel}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                className="h-9 rounded-md border border-white/[0.08] bg-white/[0.018] px-3 text-xs font-medium text-slate-400 transition hover:border-white/15 hover:bg-white/[0.035] hover:text-slate-200 sm:h-8"
                key={quickAmount}
                onClick={() => incrementAmount(quickAmount)}
                type="button"
              >
                +${quickAmount}
              </button>
            ))}
            {isLocalContractMarket && balance > 0n && (
              <button
                className="h-9 rounded-md border border-white/[0.08] bg-white/[0.018] px-3 text-xs font-medium text-slate-400 transition hover:border-white/15 hover:bg-white/[0.035] hover:text-slate-200 sm:h-8"
                onClick={handleMaxAmount}
                type="button"
              >
                Max
              </button>
            )}
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.014] p-3 text-sm">
          <SectionLabel>Preview</SectionLabel>
          <PreviewRow label="Action" value={`${mode === "buy" ? "Buy" : "Sell"} ${side}`} />
          <PreviewRow
            label={isLocalContractMarket ? "Onchain probability" : "Reference probability"}
            value={`${selectedProbability}%`}
          />
          <PreviewRow
            label="Estimated shares"
            value={hasEnteredAmount ? estimatedShares.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "--"}
          />
          {isLocalContractMarket && (
            <PreviewRow
              label={mode === "sell" ? `${side} sell-back estimate` : "Sell-back estimate"}
              value={
                hasEnteredAmount
                  ? `${selectedSellEstimate.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`
                  : "--"
              }
            />
          )}
          {isLocalContractMarket && (
            <>
              <PreviewRow label={`${tokenLabel} balance`} value={`${formatUsdc(balance)} USDC`} />
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
        </section>

        {(sellPositionMessage || statusMessage) && (
          <TradingNotice
            message={sellPositionMessage || statusMessage}
            showFaucetLink={shouldShowFaucetLink}
          />
        )}
        <TransactionState
          error={approveWrite.error ?? buyWrite.error ?? sellWrite.error ?? claimWrite.error}
          isPending={isWriting}
          isRefreshing={isRefreshingOnchainData}
          pendingHash={approveWrite.data ?? buyWrite.data ?? sellWrite.data ?? claimWrite.data}
          successMessage={
            lastAction === "approve" && approveReceipt.isSuccess
              ? "Approval confirmed."
              : lastAction === "buy" && buyReceipt.isSuccess
                ? `${side} purchase confirmed.`
                : lastAction === "sellYes" && sellReceipt.isSuccess
                  ? "YES sell-back confirmed."
                  : lastAction === "sellNo" && sellReceipt.isSuccess
                    ? "NO sell-back confirmed."
                    : lastAction === "claim" && claimReceipt.isSuccess
                      ? deploymentConfig.isArcTestnet
                        ? "Payout claimed on Arc Testnet."
                        : "Claim payout confirmed."
                      : ""
          }
        />

        <section className="sticky bottom-3 z-20 grid gap-2.5 rounded-lg border border-white/[0.08] bg-slate-950/95 p-2.5 shadow-[0_-16px_32px_rgba(2,6,23,0.45)] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
          <SectionLabel>Actions</SectionLabel>
          {isLocalContractMarket ? (
            <>
              <Button
                disabled={!primaryAction.enabled}
                onClick={
                  primaryAction.onClick === "approve"
                    ? handleApprove
                    : primaryAction.onClick === "buy"
                      ? handleBuy
                      : () => handleSell(side)
                }
                type="button"
                variant={primaryAction.variant}
              >
                {primaryAction.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {primaryAction.label}
              </Button>
              <Button disabled={!canClaim} onClick={handleClaim} type="button" variant="secondary">
                {isClaiming && <Loader2 className="h-4 w-4 animate-spin" />}
                Claim Payout
              </Button>
            </>
          ) : (
            <Button disabled>Contract writes unavailable</Button>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function TradingNotice({
  message,
  showFaucetLink
}: {
  message: string;
  showFaucetLink?: boolean;
}) {
  return (
    <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.035] p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-cyan-100/90">
        <ShieldCheck className="h-3.5 w-3.5" />
        Trading guardrail
      </div>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">{message}</p>
      {showFaucetLink && (
        <Link
          className="mt-2 inline-flex text-xs font-medium text-cyan-200/90 transition hover:text-cyan-100"
          href={CIRCLE_FAUCET_URL}
          rel="noreferrer"
          target="_blank"
        >
          Need Arc testnet USDC for gas and settlement? Get it from the Circle faucet.
        </Link>
      )}
    </div>
  );
}

function TransactionState({
  error,
  isPending,
  isRefreshing,
  pendingHash,
  successMessage
}: {
  error: Error | null | undefined;
  isPending: boolean;
  isRefreshing: boolean;
  pendingHash: string | undefined;
  successMessage: string;
}) {
  if (!error && !isPending && !isRefreshing && !successMessage) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3 text-sm">
      {isPending && (
        <div className="flex items-center gap-2 text-cyan-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            Pending confirmation
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
      {isRefreshing && !isPending && (
        <div className="mt-2 flex items-center gap-2 text-cyan-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing onchain data...
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
  hasClaimed,
  hasEnoughAllowance,
  hasEnoughBalance,
  hasClaimablePosition,
  hasWinningPosition,
  isConnected,
  isLocalContractMarket,
  isMarketClosed,
  isWrongChain,
  marketStatus,
  mode,
  parsedAmount,
  hasSettlementTokenMismatch,
  tokenLabel
}: {
  accountAddress: string | undefined;
  hasClaimed: boolean;
  hasEnoughAllowance: boolean;
  hasEnoughBalance: boolean;
  hasClaimablePosition: boolean;
  hasWinningPosition: boolean;
  isConnected: boolean;
  isLocalContractMarket: boolean;
  isMarketClosed: boolean;
  isWrongChain: boolean;
  marketStatus: Market["status"];
  mode: "buy" | "sell";
  parsedAmount: bigint;
  hasSettlementTokenMismatch: boolean;
  tokenLabel: string;
}) {
  if (!isLocalContractMarket) {
    return "Contract writes are unavailable for this market in the current deployment target.";
  }

  if (!isConnected || !accountAddress) {
    return deploymentConfig.isArcTestnet
      ? `Connect a wallet on ${probityChain.name}. Arc testnet USDC is used for gas and settlement.`
      : `Connect a wallet on ${probityChain.name} to approve ${tokenLabel}, buy shares, or claim payouts.`;
  }

  if (hasSettlementTokenMismatch) {
    return "This market was created with a different settlement token than the configured Arc testnet USDC. Redeploy or reseed markets with the current USDC token before trading.";
  }

  if (isWrongChain) {
    return `Switch your wallet to ${probityChain.name} (${probityChain.id}) before sending transactions.`;
  }

  if (isMarketClosed) {
    if (marketStatus === "expired") {
      return "Awaiting resolver settlement. Claim is available after the resolver finalizes the winning outcome.";
    }

    if (hasClaimed) {
      return "Payout claimed.";
    }

    if (hasClaimablePosition) {
      return "Resolved winning position detected. Claim Payout is available.";
    }

    if (!hasWinningPosition) {
      return "No winning position to claim.";
    }

    return "Claim is available after the resolver finalizes the winning outcome.";
  }

  if (parsedAmount <= 0n) {
    return "Enter an amount to preview and trade.";
  }

  if (mode === "sell") {
    return "";
  }

  if (!hasEnoughBalance) {
    return deploymentConfig.isArcTestnet
      ? "Need Arc testnet USDC for gas and settlement? Get it from the Circle faucet."
      : `Your connected wallet does not have enough ${tokenLabel} for this trade.`;
  }

  if (!hasEnoughAllowance) {
    return deploymentConfig.isArcTestnet
      ? "Approve USDC for this market before buying YES or NO."
      : `Approve ${tokenLabel} for this market before buying YES or NO.`;
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

function formatAmountInput(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: USDC_DECIMALS,
    useGrouping: false
  });
}

function getPrimaryAction({
  canApprove,
  canBuy,
  canSellSelectedSide,
  hasEnteredAmount,
  hasEnoughAllowance,
  isApproving,
  isBuying,
  isSelling,
  mode,
  side,
  tokenLabel
}: {
  canApprove: boolean;
  canBuy: boolean;
  canSellSelectedSide: boolean;
  hasEnteredAmount: boolean;
  hasEnoughAllowance: boolean;
  isApproving: boolean;
  isBuying: boolean;
  isSelling: boolean;
  mode: "buy" | "sell";
  side: "YES" | "NO";
  tokenLabel: string;
}) {
  if (!hasEnteredAmount) {
    return {
      enabled: false,
      isLoading: false,
      label: "Enter amount",
      onClick: mode,
      variant: "secondary" as const
    };
  }

  if (mode === "sell") {
    return {
      enabled: canSellSelectedSide,
      isLoading: isSelling,
      label: `Sell ${side}`,
      onClick: "sell" as const,
      variant: "outline" as const
    };
  }

  if (!hasEnoughAllowance) {
    return {
      enabled: canApprove,
      isLoading: isApproving,
      label: `Approve ${tokenLabel}`,
      onClick: "approve" as const,
      variant: "default" as const
    };
  }

  return {
    enabled: canBuy,
    isLoading: isBuying,
    label: `Buy ${side}`,
    onClick: "buy" as const,
    variant: "outline" as const
  };
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

  if (raw.includes("InsufficientPosition")) {
    return "You do not have enough YES/NO shares to sell that amount.";
  }

  if (raw.includes("MarketExpired")) {
    return "Sell-back is disabled after market expiration.";
  }

  if (raw.includes("MarketAlreadyResolved")) {
    return "Sell-back is disabled after market resolution.";
  }

  if (raw.includes("InsufficientContractLiquidity")) {
    return "The market contract does not have enough available USDC liquidity for this sell-back.";
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
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {children}
    </div>
  );
}

function SecondaryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-2 text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-500">{value}</span>
    </div>
  );
}
