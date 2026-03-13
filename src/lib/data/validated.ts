import bilateralTradeRaw from './bilateral-trade-shares.json';
import commodityProducersRaw from './commodity-producers.json';

interface BilateralTradeEntry {
  tradeVolumeUsd: number;
  year: number;
}

interface BilateralTradeDataset {
  metadata: {
    source: string;
    url: string;
    year: number;
    note: string;
    schemaVersion?: number;
  };
  pairs: Record<string, BilateralTradeEntry>;
}

interface CommodityMetadataSource {
  name: string;
  url: string;
}

interface CommodityMetadata {
  sources: CommodityMetadataSource[];
  year: number;
  note: string;
  schemaVersion?: number;
  fieldDefinitions?: Record<string, string>;
}

interface CommodityProductionEntry {
  pctWorldProduction: number;
  globalGdpShockUsd?: number;
  priceShockUsdPerBarrel?: number;
  priceShockPctGlobal?: number;
  note: string;
}

interface WheatEntry {
  pctWorldExports: number;
  globalGdpShockUsd?: number;
  foodSecurityCountriesAffected?: number;
  note: string;
}

export interface CommodityProducersDataset {
  metadata: CommodityMetadata;
  oil: Record<string, CommodityProductionEntry>;
  naturalGas: Record<string, CommodityProductionEntry>;
  wheat: Record<string, WheatEntry>;
  semiconductors: Record<string, CommodityProductionEntry>;
  lithium: Record<string, CommodityProductionEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric field: ${label}`);
  }
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid string field: ${label}`);
  }
  return value;
}

function asOptionalFiniteNumber(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  return asFiniteNumber(value, label);
}

function assertShareRange(share: number, label: string): void {
  if (share < 0 || share > 100) {
    throw new Error(`Share out of range (0..100): ${label}`);
  }
}

function assertAlpha3(code: string, label: string): void {
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error(`Invalid ISO alpha-3 code: ${label}`);
  }
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

export function canonicalPairKey(codeA: string, codeB: string): string {
  const a = codeA.toUpperCase();
  const b = codeB.toUpperCase();
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function validateBilateralTradeDataset(raw: unknown): BilateralTradeDataset {
  if (!isRecord(raw)) throw new Error('Invalid bilateral trade dataset root');
  if (!isRecord(raw.metadata)) throw new Error('Missing bilateral trade metadata');
  if (!isRecord(raw.pairs)) throw new Error('Missing bilateral trade pairs');

  const metadata = {
    source: asString(raw.metadata.source, 'bilateral.metadata.source'),
    url: asString(raw.metadata.url, 'bilateral.metadata.url'),
    year: asFiniteNumber(raw.metadata.year, 'bilateral.metadata.year'),
    note: asString(raw.metadata.note, 'bilateral.metadata.note'),
    schemaVersion: asOptionalFiniteNumber(raw.metadata.schemaVersion, 'bilateral.metadata.schemaVersion'),
  };

  const pairs: Record<string, BilateralTradeEntry> = {};

  for (const [key, value] of Object.entries(raw.pairs)) {
    if (!isRecord(value)) {
      throw new Error(`Invalid bilateral pair payload: ${key}`);
    }

    const match = key.match(/^([A-Z]{3})-([A-Z]{3})$/);
    if (!match) {
      throw new Error(`Invalid bilateral pair key format: ${key}`);
    }

    const [, codeA, codeB] = match;
    assertAlpha3(codeA, key);
    assertAlpha3(codeB, key);

    const canonical = canonicalPairKey(codeA, codeB);
    const parsed: BilateralTradeEntry = {
      tradeVolumeUsd: asFiniteNumber(value.tradeVolumeUsd, `bilateral.pairs.${key}.tradeVolumeUsd`),
      year: asFiniteNumber(value.year, `bilateral.pairs.${key}.year`),
    };

    if (parsed.tradeVolumeUsd <= 0) {
      throw new Error(`Non-positive tradeVolumeUsd for pair: ${key}`);
    }

    const existing = pairs[canonical];
    if (existing && (existing.tradeVolumeUsd !== parsed.tradeVolumeUsd || existing.year !== parsed.year)) {
      throw new Error(`Conflicting duplicate bilateral pair: ${canonical}`);
    }

    pairs[canonical] = existing ?? parsed;
  }

  return {
    metadata,
    pairs: sortRecord(pairs),
  };
}

function validateProductionCategory(
  categoryName: string,
  rawCategory: unknown,
): Record<string, CommodityProductionEntry> {
  if (!isRecord(rawCategory)) {
    throw new Error(`Missing commodity category: ${categoryName}`);
  }

  const validated: Record<string, CommodityProductionEntry> = {};
  for (const [code, value] of Object.entries(rawCategory)) {
    assertAlpha3(code, `${categoryName}.${code}`);
    if (!isRecord(value)) {
      throw new Error(`Invalid commodity entry: ${categoryName}.${code}`);
    }

    const pctWorldProduction = asFiniteNumber(
      value.pctWorldProduction,
      `${categoryName}.${code}.pctWorldProduction`
    );
    assertShareRange(pctWorldProduction, `${categoryName}.${code}.pctWorldProduction`);

    validated[code] = {
      pctWorldProduction,
      globalGdpShockUsd: asOptionalFiniteNumber(
        value.globalGdpShockUsd,
        `${categoryName}.${code}.globalGdpShockUsd`
      ),
      priceShockUsdPerBarrel: asOptionalFiniteNumber(
        value.priceShockUsdPerBarrel,
        `${categoryName}.${code}.priceShockUsdPerBarrel`
      ),
      priceShockPctGlobal: asOptionalFiniteNumber(
        value.priceShockPctGlobal,
        `${categoryName}.${code}.priceShockPctGlobal`
      ),
      note: asString(value.note, `${categoryName}.${code}.note`),
    };
  }

  return sortRecord(validated);
}

function validateWheatCategory(rawCategory: unknown): Record<string, WheatEntry> {
  if (!isRecord(rawCategory)) {
    throw new Error('Missing commodity category: wheat');
  }

  const validated: Record<string, WheatEntry> = {};
  for (const [code, value] of Object.entries(rawCategory)) {
    assertAlpha3(code, `wheat.${code}`);
    if (!isRecord(value)) {
      throw new Error(`Invalid commodity entry: wheat.${code}`);
    }

    const pctWorldExports = asFiniteNumber(
      value.pctWorldExports,
      `wheat.${code}.pctWorldExports`
    );
    assertShareRange(pctWorldExports, `wheat.${code}.pctWorldExports`);

    validated[code] = {
      pctWorldExports,
      globalGdpShockUsd: asOptionalFiniteNumber(
        value.globalGdpShockUsd,
        `wheat.${code}.globalGdpShockUsd`
      ),
      foodSecurityCountriesAffected: asOptionalFiniteNumber(
        value.foodSecurityCountriesAffected,
        `wheat.${code}.foodSecurityCountriesAffected`
      ),
      note: asString(value.note, `wheat.${code}.note`),
    };
  }

  return sortRecord(validated);
}

function validateCommodityMetadata(rawMetadata: unknown): CommodityMetadata {
  if (!isRecord(rawMetadata)) {
    throw new Error('Missing commodity metadata');
  }

  if (!Array.isArray(rawMetadata.sources)) {
    throw new Error('Invalid commodity metadata.sources');
  }

  const sources: CommodityMetadataSource[] = rawMetadata.sources.map((src, idx) => {
    if (!isRecord(src)) throw new Error(`Invalid commodity metadata.sources[${idx}]`);
    return {
      name: asString(src.name, `commodity.metadata.sources[${idx}].name`),
      url: asString(src.url, `commodity.metadata.sources[${idx}].url`),
    };
  });

  let fieldDefinitions: Record<string, string> | undefined;
  if (rawMetadata.fieldDefinitions !== undefined) {
    if (!isRecord(rawMetadata.fieldDefinitions)) {
      throw new Error('Invalid commodity metadata.fieldDefinitions');
    }
    fieldDefinitions = {};
    for (const [key, value] of Object.entries(rawMetadata.fieldDefinitions)) {
      fieldDefinitions[key] = asString(value, `commodity.metadata.fieldDefinitions.${key}`);
    }
  }

  return {
    sources,
    year: asFiniteNumber(rawMetadata.year, 'commodity.metadata.year'),
    note: asString(rawMetadata.note, 'commodity.metadata.note'),
    schemaVersion: asOptionalFiniteNumber(rawMetadata.schemaVersion, 'commodity.metadata.schemaVersion'),
    fieldDefinitions,
  };
}

function validateCommodityProducersDataset(raw: unknown): CommodityProducersDataset {
  if (!isRecord(raw)) throw new Error('Invalid commodity producers dataset root');

  return {
    metadata: validateCommodityMetadata(raw.metadata),
    oil: validateProductionCategory('oil', raw.oil),
    naturalGas: validateProductionCategory('naturalGas', raw.naturalGas),
    wheat: validateWheatCategory(raw.wheat),
    semiconductors: validateProductionCategory('semiconductors', raw.semiconductors),
    lithium: validateProductionCategory('lithium', raw.lithium),
  };
}

export const bilateralTradeData = validateBilateralTradeDataset(bilateralTradeRaw);
export const commodityProducersData = validateCommodityProducersDataset(commodityProducersRaw);
