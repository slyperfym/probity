"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { decodeEventLog, getAddress, isAddress, type Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { probityChain } from "@/config/chains";
import {
  contractAbis,
  contractAddresses,
  deploymentConfig,
  getMarketFactoryConfig,
  hasContractAddress
} from "@/config/contracts";
import { normalizedQuestionHash } from "@/features/discovery/lib/external-reference-matching";
import { refreshOnchainQueries } from "@/lib/onchain-cache";

const categories = ["Macro", "Crypto", "Policy", "Arc", "Earnings"];

export function CreateMarketForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { address: accountAddress, chain, isConnected } = useAccount();
  const createWrite = useWriteContract();
  const createReceipt = useWaitForTransactionReceipt({ hash: createWrite.data });
  const importedQuestion = searchParams.get("question") ?? "";
  const importedCategory = searchParams.get("category") ?? "Macro";
  const importedExpiry = searchParams.get("expiry") ?? "";
  const importedProbability = searchParams.get("probability") ?? "";
  const importedExternalId = searchParams.get("externalId") ?? "";
  const importedSource = searchParams.get("source");
  const importedSourceLabel = searchParams.get("sourceLabel") ?? "External market metadata";
  const importedSourceUrl = searchParams.get("sourceUrl") ?? "";
  const hasImportedReference = importedSource === "polymarket";
  const [category, setCategory] = React.useState(
    categories.includes(importedCategory) ? importedCategory : "Macro"
  );
  const [question, setQuestion] = React.useState(importedQuestion);
  const [description, setDescription] = React.useState(() =>
    hasImportedReference
      ? "Drafted from external market reference metadata. Probity deployment, trading, settlement, and resolution remain Arc-native and independent."
      : ""
  );
  const [expiry, setExpiry] = React.useState(importedExpiry ? importedExpiry.slice(0, 10) : "");
  const [resolver, setResolver] = React.useState(
    deploymentConfig.resolverAddress ?? accountAddress ?? ""
  );
  const [hasManuallyEditedResolver, setHasManuallyEditedResolver] = React.useState(false);
  const [isRefreshingOnchainData, setIsRefreshingOnchainData] = React.useState(false);
  const resolutionCriteriaId = React.useId();
  const isFactoryConfigured = hasContractAddress("MarketFactory");
  const isSettlementTokenConfigured = hasContractAddress("MockUSDC");
  const resolverAddress = isAddress(resolver) ? getAddress(resolver) : undefined;
  const normalizedAccount = accountAddress ? getAddress(accountAddress) : undefined;
  const shouldReadAccess = deploymentConfig.marketDataMode !== "mock" && isFactoryConfigured;
  const factoryConfig = getMarketFactoryConfig();
  const approvedCreator = useReadContract({
    ...factoryConfig,
    args: normalizedAccount ? [normalizedAccount] : undefined,
    functionName: "approvedCreators",
    query: {
      enabled: shouldReadAccess && Boolean(normalizedAccount)
    }
  });
  const approvedResolver = useReadContract({
    ...factoryConfig,
    args: resolverAddress ? [resolverAddress] : undefined,
    functionName: "approvedResolvers",
    query: {
      enabled: shouldReadAccess && Boolean(resolverAddress)
    }
  });
  const approvedConnectedResolver = useReadContract({
    ...factoryConfig,
    args: normalizedAccount ? [normalizedAccount] : undefined,
    functionName: "approvedResolvers",
    query: {
      enabled: shouldReadAccess && Boolean(normalizedAccount)
    }
  });
  const createdMarketAddress = React.useMemo(
    () => parseCreatedMarketAddress(createReceipt.data?.logs),
    [createReceipt.data?.logs]
  );
  const isApprovedCreator = Boolean(approvedCreator.data);
  const isApprovedResolver = Boolean(approvedResolver.data);
  const isConnectedWalletApprovedResolver = Boolean(approvedConnectedResolver.data);
  const isUsingConnectedWalletAsResolver =
    Boolean(normalizedAccount && resolverAddress && normalizedAccount === resolverAddress);
  const isCreating = createWrite.isPending || createReceipt.isLoading;
  const createDisabledReason = getCreateDisabledReason({
    chainId: chain?.id,
    expiry,
    isApprovedCreator,
    isApprovedResolver,
    isConnected,
    isCreating,
    isFactoryConfigured,
    isSettlementTokenConfigured,
    marketDataMode: deploymentConfig.marketDataMode,
    question,
    resolverAddress
  });

  React.useEffect(() => {
    setHasManuallyEditedResolver(false);
  }, [normalizedAccount]);

  React.useEffect(() => {
    if (!normalizedAccount || !isApprovedCreator || hasManuallyEditedResolver) {
      return;
    }

    const configuredResolver = deploymentConfig.resolverAddress;
    const shouldUseCreatorWallet =
      !resolver ||
      (configuredResolver && resolver.toLowerCase() === configuredResolver.toLowerCase()) ||
      !isAddress(resolver);

    if (shouldUseCreatorWallet) {
      setResolver(normalizedAccount);
    }
  }, [hasManuallyEditedResolver, isApprovedCreator, normalizedAccount, resolver]);

  React.useEffect(() => {
    if (createReceipt.isSuccess) {
      setIsRefreshingOnchainData(true);
      void refreshOnchainQueries(queryClient).finally(() => setIsRefreshingOnchainData(false));
    }
  }, [createReceipt.isSuccess, queryClient]);

  function createMarket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createDisabledReason || !resolverAddress || !contractAddresses.MockUSDC) {
      return;
    }

    createWrite.writeContract({
      ...factoryConfig,
      args: [
        contractAddresses.MockUSDC,
        resolverAddress,
        BigInt(toExpirationTimestamp(expiry)),
        question.trim(),
        buildMetadataURI({
          category,
          description,
          importedProbability,
          importedExternalId,
          importedSourceLabel,
          importedSourceUrl,
          question,
          externalEndDate: importedExpiry,
          resolutionCriteria:
            document.getElementById(resolutionCriteriaId) instanceof HTMLTextAreaElement
              ? (document.getElementById(resolutionCriteriaId) as HTMLTextAreaElement).value
              : ""
        })
      ],
      functionName: "createMarket"
    });
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Create Market</CardTitle>
          <Badge variant="info">{hasImportedReference ? "External reference draft" : "New market draft"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <form className="space-y-5" onSubmit={createMarket}>
          {hasImportedReference && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-sm font-medium text-indigo-800">Reference imported from public market metadata</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This draft uses external market metadata as a reference. The created Probity market
                will be a separate Arc-native market with independent USDC settlement.
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <ReferenceMetric label="Source" value={importedSourceLabel} />
                {importedExternalId && <ReferenceMetric label="External ID" value={importedExternalId} />}
                {importedSourceUrl && <ReferenceMetric label="External URL" value={importedSourceUrl} />}
                <ReferenceMetric
                  label="Initial YES probability"
                  value={importedProbability ? `${importedProbability}%` : "Not provided"}
                />
                <ReferenceMetric label="Category" value={category} />
                <ReferenceMetric label="Expiry" value={expiry || "Not provided"} />
              </div>
              {importedSourceUrl && (
                <a
                  className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-700 transition hover:text-indigo-900"
                  href={importedSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  View external reference only
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          <Field label="Market question">
            <input
              className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 sm:h-11"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Will a defined event occur by a specific date?"
              value={question}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the market and the institutional signal it is intended to capture."
              value={description}
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Category">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {categories.map((item) => (
                  <Button
                    className="w-full sm:w-auto"
                    key={item}
                    onClick={() => setCategory(item)}
                    size="sm"
                    type="button"
                    variant={category === item ? "outline" : "secondary"}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Expiration">
              <div className="flex h-12 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500 sm:h-11">
                <CalendarClock className="h-4 w-4" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                  onChange={(event) => setExpiry(event.target.value)}
                  type="date"
                  value={expiry}
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Settlement token">
              <div className="flex h-12 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:h-11">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                {deploymentConfig.isArcTestnet ? "Arc testnet USDC" : "Local settlement token"}
              </div>
            </Field>
            <Field label="Resolver">
              <input
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 sm:h-11"
                onChange={(event) => {
                  setHasManuallyEditedResolver(true);
                  setResolver(event.target.value);
                }}
                placeholder="Probity Resolver Desk"
                value={resolver}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {getResolverHelperCopy({
                  isApprovedCreator,
                  isConnected,
                  isConnectedWalletApprovedResolver,
                  isUsingConnectedWalletAsResolver,
                  resolverAddress
                })}
              </p>
            </Field>
          </div>

          <Field label="Resolution criteria">
            <textarea
              id={resolutionCriteriaId}
              className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
              placeholder="Define YES, NO, invalid/cancelled cases, and acceptable source references."
              defaultValue={
                importedProbability
                  ? `Initial displayed probability reference: ${importedProbability}% YES. Define independent Probity YES/NO criteria before deployment.`
                  : undefined
              }
            />
          </Field>

          <EligibilityPanel
            accountAddress={accountAddress}
            chainId={chain?.id}
            chainName={chain?.name}
            isApprovedCreator={isApprovedCreator}
            isApprovedResolver={isApprovedResolver}
            isConnectedWalletApprovedResolver={isConnectedWalletApprovedResolver}
            isUsingConnectedWalletAsResolver={isUsingConnectedWalletAsResolver}
            isConnected={isConnected}
            resolverAddress={resolverAddress}
          />

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-800">
              <FileText className="h-4 w-4" />
              Arc-native MarketFactory creation
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Only approved Probity creators can submit this transaction. External metadata can
              prefill the draft, but the created market is a separate PredictionMarket deployed by
              Probity on the configured chain.
            </p>
            {!isApprovedCreator && isConnected && (
              <p className="mt-3 text-sm text-amber-700">
                Public market proposals are not enabled yet. Connect an approved creator wallet to
                create an Arc-native market.
              </p>
            )}
            <p className="mt-3 text-sm text-slate-500">
              {createDisabledReason ??
                "Connected wallet is approved to create markets with the selected resolver."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-950">Suggest Market</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Public market proposals are not enabled yet. For now, market creation is restricted
              to approved creator wallets.
            </p>
          </div>

          <CreateTransactionState
            createdMarketAddress={createdMarketAddress}
            error={createWrite.error?.message}
            isPending={isCreating}
            isRefreshing={isRefreshingOnchainData}
            success={createReceipt.isSuccess}
            transactionHash={createWrite.data}
          />

          <div className="sticky bottom-3 z-20 flex rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
            <Button className="w-full sm:w-auto" disabled={Boolean(createDisabledReason)} type="submit">
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {deploymentConfig.isArcTestnet ? "Create Market on Arc Testnet" : "Create Arc-Native Market"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ReferenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-indigo-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 break-all text-sm font-medium text-slate-950">{value}</div>
    </div>
  );
}

function EligibilityPanel({
  accountAddress,
  chainId,
  chainName,
  isApprovedCreator,
  isApprovedResolver,
  isConnectedWalletApprovedResolver,
  isUsingConnectedWalletAsResolver,
  isConnected,
  resolverAddress
}: {
  accountAddress: Address | undefined;
  chainName: string | undefined;
  chainId: number | undefined;
  isApprovedCreator: boolean;
  isApprovedResolver: boolean;
  isConnectedWalletApprovedResolver: boolean;
  isUsingConnectedWalletAsResolver: boolean;
  isConnected: boolean;
  resolverAddress: Address | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-950">Wallet eligibility</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <EligibilityMetric
          label="Wallet"
          tone={isConnected ? "yes" : "warn"}
          value={isConnected && accountAddress ? shortHash(accountAddress) : "Not connected"}
        />
        <EligibilityMetric
          label="Current chain"
          tone={chainId === probityChain.id ? "yes" : "warn"}
          value={chainName ?? `Connect to ${probityChain.name}`}
        />
        <EligibilityMetric
          label="Approved creator"
          tone={isApprovedCreator ? "yes" : "warn"}
          value={isApprovedCreator ? "Approved" : "Not approved"}
        />
        <EligibilityMetric
          label="Approved resolver"
          tone={resolverAddress && isApprovedResolver ? "yes" : "warn"}
          value={
            !resolverAddress
              ? "Invalid resolver"
              : isApprovedResolver
                ? "Approved"
                : "Not approved"
          }
        />
      </div>
      {isConnected && isApprovedCreator && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {isConnectedWalletApprovedResolver && isUsingConnectedWalletAsResolver
            ? "This wallet can create and resolve this market."
            : isConnectedWalletApprovedResolver
              ? "This wallet can resolve markets. Use it as resolver for the simplest MVP flow."
              : "This wallet can create markets but is not approved as a resolver. Use an approved resolver address."}
        </p>
      )}
    </div>
  );
}

function getResolverHelperCopy({
  isApprovedCreator,
  isConnected,
  isConnectedWalletApprovedResolver,
  isUsingConnectedWalletAsResolver,
  resolverAddress
}: {
  isApprovedCreator: boolean;
  isConnected: boolean;
  isConnectedWalletApprovedResolver: boolean;
  isUsingConnectedWalletAsResolver: boolean;
  resolverAddress: Address | undefined;
}) {
  if (!isConnected) {
    return "Connect an approved creator wallet to set the resolver for this market.";
  }

  if (isApprovedCreator && isConnectedWalletApprovedResolver && isUsingConnectedWalletAsResolver) {
    return "For this MVP, using your creator wallet as resolver makes it easier to resolve markets you create.";
  }

  if (isApprovedCreator && !isConnectedWalletApprovedResolver) {
    return "This wallet can create markets but is not approved as a resolver. Use an approved resolver address.";
  }

  if (!resolverAddress) {
    return "Enter an approved resolver wallet address.";
  }

  return "Resolver remains editable. Any custom resolver must be approved by the MarketFactory.";
}

function EligibilityMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "yes" | "warn";
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={tone === "yes" ? "mt-1 text-sm font-medium text-emerald-700" : "mt-1 text-sm font-medium text-amber-700"}>
        {value}
      </div>
    </div>
  );
}

function CreateTransactionState({
  createdMarketAddress,
  error,
  isPending,
  isRefreshing,
  success,
  transactionHash
}: {
  createdMarketAddress: Address | undefined;
  error: string | undefined;
  isPending: boolean;
  isRefreshing: boolean;
  success: boolean;
  transactionHash: `0x${string}` | undefined;
}) {
  if (!error && !isPending && !isRefreshing && !success) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      {isPending && (
        <div className="flex items-center gap-2 text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Market creation transaction pending{transactionHash ? ` (${shortHash(transactionHash)})` : ""}.
        </div>
      )}
      {success && !isPending && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {deploymentConfig.isArcTestnet
              ? "Market created on Arc Testnet."
              : "Market created on the configured Probity MarketFactory."}
          </div>
          {createdMarketAddress && (
            <div className="flex flex-col gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-xs text-emerald-800">{createdMarketAddress}</span>
              <Link className="text-indigo-700 transition hover:text-indigo-900" href={`/markets/${createdMarketAddress}`}>
                Open created market
              </Link>
            </div>
          )}
        </div>
      )}
      {isRefreshing && !isPending && (
        <div className="mt-3 flex items-center gap-2 text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing onchain market list.
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-rose-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formatCreateError(error)}</span>
        </div>
      )}
    </div>
  );
}

function getCreateDisabledReason({
  expiry,
  chainId,
  isApprovedCreator,
  isApprovedResolver,
  isConnected,
  isCreating,
  isFactoryConfigured,
  isSettlementTokenConfigured,
  marketDataMode,
  question,
  resolverAddress
}: {
  chainId: number | undefined;
  expiry: string;
  isApprovedCreator: boolean;
  isApprovedResolver: boolean;
  isConnected: boolean;
  isCreating: boolean;
  isFactoryConfigured: boolean;
  isSettlementTokenConfigured: boolean;
  marketDataMode: string;
  question: string;
  resolverAddress: Address | undefined;
}) {
  if (marketDataMode === "mock") {
    return "Contract writes are disabled for this environment, so onchain market creation is unavailable.";
  }

  if (!isFactoryConfigured || !isSettlementTokenConfigured) {
    return "MarketFactory and settlement token addresses must be configured before creating markets.";
  }

  if (!isConnected) {
    return "Connect an approved creator wallet to create an Arc-native market.";
  }

  if (chainId !== probityChain.id) {
    return `Switch to ${probityChain.name} (${probityChain.id}) before creating a market.`;
  }

  if (!isApprovedCreator) {
    return "This wallet is not approved to create Probity markets.";
  }

  if (!resolverAddress) {
    return "Enter a valid approved resolver address.";
  }

  if (!isApprovedResolver) {
    return "Selected resolver address is not approved by the MarketFactory.";
  }

  if (!question.trim()) {
    return "Enter a market question before creating the market.";
  }

  if (!expiry || toExpirationTimestamp(expiry) <= Math.floor(Date.now() / 1000)) {
    return "Choose a future expiration date.";
  }

  if (isCreating) {
    return "Market creation transaction is pending.";
  }

  return null;
}

function buildMetadataURI({
  category,
  description,
  externalEndDate,
  importedExternalId,
  importedProbability,
  importedSourceLabel,
  importedSourceUrl,
  question,
  resolutionCriteria
}: {
  category: string;
  description: string;
  externalEndDate: string;
  importedExternalId: string;
  importedProbability: string;
  importedSourceLabel: string;
  importedSourceUrl: string;
  question: string;
  resolutionCriteria: string;
}) {
  const isExternalReference = Boolean(importedExternalId || importedSourceUrl);
  const params = new URLSearchParams({
    category,
    description,
    externalEndDate,
    externalId: importedExternalId,
    externalQuestion: isExternalReference ? question.trim() : "",
    externalSourceLabel: isExternalReference ? importedSourceLabel : "",
    externalSourceUrl: importedSourceUrl,
    normalizedQuestionHash: normalizedQuestionHash(question),
    resolutionCriteria,
    source: importedSourceUrl ? importedSourceLabel : "Probity Create",
    sourceUrl: importedSourceUrl
  });

  if (importedProbability) {
    params.set("initialProbability", importedProbability);
  }

  return `probity://market?${params.toString()}`;
}

function parseCreatedMarketAddress(logs: { topics: readonly `0x${string}`[]; data: `0x${string}` }[] | undefined) {
  if (!logs) {
    return undefined;
  }

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: contractAbis.marketFactory,
        data: log.data,
        topics: [...log.topics] as [`0x${string}`, ...`0x${string}`[]]
      });

      if (decoded.eventName === "MarketCreated" && decoded.args && "market" in decoded.args) {
        return getAddress(decoded.args.market as Address);
      }
    } catch {
      // Ignore unrelated logs from wallets or chain middleware.
    }
  }

  return undefined;
}

function toExpirationTimestamp(expiry: string) {
  return Math.floor(new Date(`${expiry}T23:59:59Z`).getTime() / 1000);
}

function formatCreateError(error: string) {
  if (error.includes("NotApprovedCreator")) {
    return "Connected wallet is not approved to create markets.";
  }

  if (error.includes("ResolverNotApproved")) {
    return "Selected resolver is not approved on the MarketFactory.";
  }

  if (error.includes("InvalidExpiration")) {
    return "Expiration must be in the future.";
  }

  return error.length > 180 ? `${error.slice(0, 180)}...` : error;
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
