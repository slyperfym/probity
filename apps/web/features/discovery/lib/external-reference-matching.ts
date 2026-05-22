import type {
  ExternalMarketReference,
  ExternalReferenceMetadata
} from "@/features/discovery/types";
import type { Market } from "@/features/markets/types";

export function normalizeQuestion(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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
  if (!metadataURI?.startsWith("probity://market?")) {
    return null;
  }

  const query = metadataURI.slice("probity://market?".length);
  const params = new URLSearchParams(query);
  const metadata: ExternalReferenceMetadata = {
    externalEndDate: readParam(params, "externalEndDate"),
    externalId: readParam(params, "externalId"),
    externalQuestion: readParam(params, "externalQuestion"),
    externalSourceLabel: readParam(params, "externalSourceLabel"),
    externalSourceUrl: readParam(params, "externalSourceUrl"),
    normalizedQuestionHash: readParam(params, "normalizedQuestionHash")
  };

  return Object.values(metadata).some(Boolean) ? metadata : null;
}

export function findProbityMarketForExternalSignal(
  signal: ExternalMarketReference,
  markets: Market[]
) {
  return markets.find((market) => {
    const metadata = market.externalReference;

    if (!metadata) {
      return false;
    }

    const signalUrl = normalizeUrl(signal.url);
    const metadataUrl = normalizeUrl(metadata.externalSourceUrl);

    if (metadata.externalId && metadata.externalId === signal.id) {
      return true;
    }

    if (signalUrl && metadataUrl && signalUrl === metadataUrl) {
      return true;
    }

    const signalQuestionHash = normalizedQuestionHash(signal.question);

    if (
      metadata.normalizedQuestionHash &&
      metadata.normalizedQuestionHash === signalQuestionHash
    ) {
      return true;
    }

    return (
      normalizeQuestion(metadata.externalQuestion ?? market.title) === normalizeQuestion(signal.question) &&
      normalizeDate(metadata.externalEndDate ?? market.expiresAt) === normalizeDate(signal.endDate)
    );
  });
}

function readParam(params: URLSearchParams, key: keyof ExternalReferenceMetadata) {
  return params.get(key) ?? undefined;
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
