import type {
  ExternalMarketReference,
  ExternalReferenceMetadata
} from "@/features/discovery/types";
import { parseMarketMetadata } from "@/features/markets/lib/market-metadata";
import type { Market } from "@/features/markets/types";

export function normalizeQuestion(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[°º]/g, " degrees ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[$€£]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getExternalSignalKey(signal: ExternalMarketReference) {
  return {
    endDate: normalizeDate(signal.endDate),
    id: signal.id,
    question: normalizeQuestion(signal.question),
    questionHash: normalizedQuestionHash(signal.question),
    titleExpiry: `${normalizeQuestion(signal.question)}::${normalizeDate(signal.endDate)}`,
    url: normalizeUrl(signal.url)
  };
}

export function getProbityMarketKey(market: Market) {
  const metadata = market.externalReference;
  const metadataQuestion = metadata?.externalQuestion
    ? normalizeQuestion(metadata.externalQuestion)
    : "";
  const titleQuestion = normalizeQuestion(market.title);
  const question = metadataQuestion || titleQuestion;

  return {
    endDate: normalizeDate(metadata?.externalEndDate ?? market.expiresAt),
    externalId: metadata?.externalId ?? "",
    metadataQuestion,
    metadataQuestionHash: metadata?.normalizedQuestionHash ?? "",
    question,
    questionHash: metadata?.normalizedQuestionHash ?? normalizedQuestionHash(market.title),
    titleExpiry: `${question}::${normalizeDate(metadata?.externalEndDate ?? market.expiresAt)}`,
    titleQuestion,
    url: normalizeUrl(metadata?.externalSourceUrl)
  };
}

export function normalizedQuestionHash(value: string) {
  let hash = 0;
  const normalized = normalizeQuestion(value);

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function parseExternalReferenceMetadata(metadataURI: string | undefined) {
  if (!metadataURI) {
    return null;
  }

  const parsed = parseMarketMetadata(metadataURI);
  const metadata: ExternalReferenceMetadata = {
    externalEndDate: parsed.externalEndDate,
    externalId: parsed.externalId,
    externalQuestion: parsed.externalQuestion,
    externalSourceLabel: parsed.externalSourceLabel,
    externalSourceUrl: parsed.externalSourceUrl,
    normalizedQuestionHash: parsed.normalizedQuestionHash
  };

  return Object.values(metadata).some(Boolean) ? metadata : null;
}

export function findProbityMarketForExternalSignal(
  signal: ExternalMarketReference,
  markets: Market[]
) {
  return markets.find((market) => {
    const signalKey = getExternalSignalKey(signal);
    const marketKey = getProbityMarketKey(market);

    if (marketKey.externalId && marketKey.externalId === signalKey.id) {
      return true;
    }

    if (signalKey.url && marketKey.url && signalKey.url === marketKey.url) {
      return true;
    }

    if (marketKey.metadataQuestionHash && marketKey.metadataQuestionHash === signalKey.questionHash) {
      return true;
    }

    if (marketKey.metadataQuestion && marketKey.metadataQuestion === signalKey.question) {
      return true;
    }

    if (marketKey.titleQuestion === signalKey.question) {
      return true;
    }

    return Boolean(signalKey.endDate && marketKey.titleExpiry === signalKey.titleExpiry);
  });
}

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/$/, "");
  }
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}
