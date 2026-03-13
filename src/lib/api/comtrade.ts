import { BilateralTradeLiveData } from '@/types';
import { getM49Code } from '@/lib/utils/m49';

const COMTRADE_TOOLS_BASE = 'https://comtradeapi.un.org/tools/v1';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function getRows(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }
  return [];
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractTradeValue(row: JsonRecord): number | null {
  const candidates = [
    row.primaryValue,
    row.tradeValue,
    row.trade_value,
    row.TradeValue,
    row.value,
    row.cifValue,
    row.cifvalue,
    row.fobValue,
    row.fobvalue,
  ];

  for (const candidate of candidates) {
    const parsed = parseNumeric(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
}

function extractYear(row: JsonRecord, fallbackYear: number): number {
  const candidates = [row.period, row.refYear, row.year];
  for (const candidate of candidates) {
    const parsed = parseNumeric(candidate);
    if (parsed !== null) {
      const year = Math.trunc(parsed);
      if (year >= 1900 && year <= 2100) return year;
      const asText = String(year);
      if (asText.length >= 4) return Number.parseInt(asText.slice(0, 4), 10);
    }
  }
  return fallbackYear;
}

function candidateYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];
}

export async function fetchComtradeBilateralTrade(
  aggressorCode: string,
  targetCode: string,
  signal?: AbortSignal
): Promise<BilateralTradeLiveData | null> {
  const subscriptionKey = process.env.COMTRADE_SUBSCRIPTION_KEY;
  if (!subscriptionKey) return null;

  const reporterM49 = getM49Code(aggressorCode);
  const partnerM49 = getM49Code(targetCode);
  if (!reporterM49 || !partnerM49) return null;

  for (const year of candidateYears()) {
    const params = new URLSearchParams({
      reporterCode: reporterM49,
      period: String(year),
      partnerCode: partnerM49,
      flowCode: 'M,X',
      includeDesc: 'false',
    });

    const url = `${COMTRADE_TOOLS_BASE}/getBilateralData/C/A/HS?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
        next: { revalidate: 86400 },
        signal,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return null;
        continue;
      }

      const payload = (await res.json()) as unknown;
      const rows = getRows(payload);
      if (rows.length === 0) continue;

      const totalTrade = rows.reduce((sum, row) => sum + (extractTradeValue(row) ?? 0), 0);
      if (totalTrade <= 0) continue;

      return {
        tradeVolumeUsd: totalTrade,
        year: extractYear(rows[0], year),
        reporterM49,
        partnerM49,
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      continue;
    }
  }

  return null;
}
