import { WorldBankDataPoint } from '@/types';

const WB_BASE = 'https://api.worldbank.org/v2';

export type WBIndicatorMap = Map<string, number | null>;

interface WBMeta {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid: string;
  lastupdated: string;
}

type WBResponse = [WBMeta, WorldBankDataPoint[] | null];

/**
 * Fetch a single World Bank indicator for one or more countries.
 * Uses mrv=1 (most recent value). Returns a Map<alpha3code, value>.
 */
export async function fetchWorldBankIndicator(
  countryCodes: string[],
  indicator: string,
  revalidate = 86400
): Promise<WBIndicatorMap> {
  const codes = countryCodes.join(';');
  const url = `${WB_BASE}/country/${codes}/indicator/${indicator}?format=json&mrv=1&per_page=50`;

  let data: WBResponse;
  try {
    const res = await fetch(url, {
      next: { revalidate },
    });
    if (!res.ok) return new Map(countryCodes.map((c) => [c, null]));
    data = (await res.json()) as WBResponse;
  } catch {
    return new Map(countryCodes.map((c) => [c, null]));
  }

  const result: WBIndicatorMap = new Map(countryCodes.map((c) => [c, null]));
  const rows = data[1];
  if (!rows) return result;

  for (const row of rows) {
    if (row.value !== null && row.countryiso3code) {
      // Use the most recent non-null value (mrv=1 may still return null)
      if (result.get(row.countryiso3code) === null) {
        result.set(row.countryiso3code, row.value);
      }
    }
  }
  return result;
}

/**
 * Fetch all required indicators for a single country in parallel.
 */
export async function fetchCountryIndicators(countryCode: string): Promise<{
  gdp: number | null;
  militaryPctGdp: number | null;
  population: number | null;
  tradeGdpPct: number | null;
}> {
  const [gdpMap, milMap, popMap, tradeMap] = await Promise.all([
    fetchWorldBankIndicator([countryCode], 'NY.GDP.MKTP.CD'),
    fetchWorldBankIndicator([countryCode], 'MS.MIL.XPND.GD.ZS'),
    fetchWorldBankIndicator([countryCode], 'SP.POP.TOTL'),
    fetchWorldBankIndicator([countryCode], 'NE.TRD.GNFS.ZS'),
  ]);

  return {
    gdp: gdpMap.get(countryCode) ?? null,
    militaryPctGdp: milMap.get(countryCode) ?? null,
    population: popMap.get(countryCode) ?? null,
    tradeGdpPct: tradeMap.get(countryCode) ?? null,
  };
}
