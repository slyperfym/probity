import type { ExternalReferenceMetadata } from "@/features/discovery/types";
import type { MarketCategory } from "@/features/markets/types";

const knownMetadataKeys = [
  "category",
  "description",
  "externalEndDate",
  "externalId",
  "externalQuestion",
  "externalSourceLabel",
  "externalSourceUrl",
  "initialProbability",
  "normalizedQuestionHash",
  "resolutionCriteria",
  "source",
  "sourceUrl"
] as const;

const validCategories: MarketCategory[] = ["Macro", "Crypto", "Policy", "Arc", "Earnings"];

export type ParsedMarketMetadata = ExternalReferenceMetadata & {
  category?: MarketCategory;
  description?: string;
  initialProbability?: string;
  resolutionCriteria?: string;
  source?: string;
  sourceUrl?: string;
};

export function parseMarketMetadata(rawMetadataOrDescription: string | undefined | null): ParsedMarketMetadata {
  if (!rawMetadataOrDescription) {
    return {};
  }

  const raw = safeDecode(rawMetadataOrDescription).trim();
  const query = extractQuery(raw);

  if (!query) {
    return looksLikeMetadata(raw) ? {} : { description: cleanDisplayText(raw) };
  }

  try {
    const params = new URLSearchParams(query);
    const category = cleanDisplayText(params.get("category"));
    const metadata: ParsedMarketMetadata = {
      category: isMarketCategory(category) ? category : undefined,
      description: cleanDisplayText(params.get("description")),
      externalEndDate: cleanDisplayText(params.get("externalEndDate")),
      externalId: cleanDisplayText(params.get("externalId")),
      externalQuestion: cleanDisplayText(params.get("externalQuestion")),
      externalSourceLabel: cleanDisplayText(params.get("externalSourceLabel") ?? params.get("source")),
      externalSourceUrl: cleanDisplayText(params.get("externalSourceUrl") ?? params.get("sourceUrl")),
      initialProbability: cleanDisplayText(params.get("initialProbability")),
      normalizedQuestionHash: cleanDisplayText(params.get("normalizedQuestionHash")),
      resolutionCriteria: cleanDisplayText(params.get("resolutionCriteria")),
      source: cleanDisplayText(params.get("source")),
      sourceUrl: cleanDisplayText(params.get("sourceUrl"))
    };

    return Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => Boolean(value))
    ) as ParsedMarketMetadata;
  } catch {
    return {};
  }
}

export function sanitizeMarketTitle(title: string, metadata?: ParsedMarketMetadata) {
  const cleanedTitle = stripMetadataFragments(cleanDisplayText(title) ?? "");

  if (cleanedTitle) {
    return cleanedTitle;
  }

  return metadata?.externalQuestion ?? "Probity market";
}

export function getDefaultMarketDescription(metadata: ParsedMarketMetadata) {
  if (metadata.description) {
    return metadata.description;
  }

  if (metadata.externalQuestion || metadata.externalSourceUrl) {
    return "Arc-native Probity market created from external reference metadata. Settlement and resolution remain independent.";
  }

  return "Contract market seeded through the Probity Foundry workflow.";
}

export function getDefaultResolutionCriteria(metadata: ParsedMarketMetadata) {
  return metadata.resolutionCriteria || "This market resolves through the configured resolver address.";
}

function extractQuery(raw: string) {
  if (raw.startsWith("probity://market?")) {
    return raw.slice("probity://market?".length);
  }

  const queryIndex = raw.indexOf("?");
  if (queryIndex >= 0 && looksLikeMetadata(raw.slice(queryIndex + 1))) {
    return raw.slice(queryIndex + 1);
  }

  if (looksLikeMetadata(raw)) {
    return raw.replace(/^[?#&]+/, "");
  }

  return "";
}

function looksLikeMetadata(value: string) {
  const lowered = value.toLowerCase();

  return knownMetadataKeys.some((key) => lowered.includes(`${key.toLowerCase()}=`));
}

function stripMetadataFragments(value: string) {
  if (value.toLowerCase().startsWith("probity://market?")) {
    return "";
  }

  if (looksLikeMetadata(value) && knownMetadataKeys.some((key) => value.toLowerCase().startsWith(`${key.toLowerCase()}=`))) {
    return "";
  }

  const metadataIndex = knownMetadataKeys.reduce((lowestIndex, key) => {
    const patterns = [`?${key}=`, `&${key}=`, `${key}=`];
    const indexes = patterns
      .map((pattern) => value.toLowerCase().indexOf(pattern.toLowerCase()))
      .filter((index) => index > 0);
    const nextIndex = indexes.length > 0 ? Math.min(...indexes) : -1;

    return nextIndex >= 0 && (lowestIndex < 0 || nextIndex < lowestIndex) ? nextIndex : lowestIndex;
  }, -1);

  return (metadataIndex >= 0 ? value.slice(0, metadataIndex) : value).trim();
}

function cleanDisplayText(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const decoded = safeDecode(value)
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return decoded || undefined;
}

function safeDecode(value: string) {
  let decoded = value;

  for (let index = 0; index < 2; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded;
}

function isMarketCategory(value: string | undefined): value is MarketCategory {
  return Boolean(value && validCategories.includes(value as MarketCategory));
}
