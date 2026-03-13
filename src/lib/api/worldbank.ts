import { WorldBankDataPoint } from '@/types';
import { fetchIMFIndicator } from '@/lib/api/imf';

const WB_BASE = 'https://api.worldbank.org/v2';

export type WBIndicatorMap = Map<string, number | null>;
export type WBObservationMap = Map<string, { value: number | null; year: number | null }>;

interface WBMeta {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid: string;
  lastupdated: string;
}

type WBResponse = [WBMeta, WorldBankDataPoint[] | null];

export async function fetchWorldBankLatestObservations(
  countryCodes: string[],
  indicator: string,
  revalidate = 86400,
  signal?: AbortSignal
): Promise<WBObservationMap> {
  const codes = countryCodes.join(';');
  const url = `${WB_BASE}/country/${codes}/indicator/${indicator}?format=json&mrv=10&per_page=50`;

  let data: WBResponse;
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal,
    });
    if (!res.ok) {
      return new Map(countryCodes.map((c) => [c, { value: null, year: null }]));
    }
    data = (await res.json()) as WBResponse;
  } catch {
    return new Map(countryCodes.map((c) => [c, { value: null, year: null }]));
  }

  const result: WBObservationMap = new Map(countryCodes.map((c) => [c, { value: null, year: null }]));
  const rows = data[1];
  if (!rows) return result;

  for (const row of rows) {
    if (row.value !== null && row.countryiso3code) {
      const current = result.get(row.countryiso3code);
      if (!current || current.value === null) {
        result.set(row.countryiso3code, {
          value: row.value,
          year: Number.parseInt(row.date, 10) || null,
        });
      }
    }
  }

  return result;
}

/**
 * Fetch a single World Bank indicator for one or more countries.
 * Requests up to the 10 most recent observations so we can fall back to the
 * latest non-null value when the current year is still blank.
 * Returns a Map<alpha3code, value>.
 */
export async function fetchWorldBankIndicator(
  countryCodes: string[],
  indicator: string,
  revalidate = 86400,
  signal?: AbortSignal
): Promise<WBIndicatorMap> {
  const latest = await fetchWorldBankLatestObservations(countryCodes, indicator, revalidate, signal);
  return new Map(countryCodes.map((c) => [c, latest.get(c)?.value ?? null]));
}

/**
 * Fetch all required indicators for a single country in parallel.
 */
export async function fetchCountryIndicators(countryCode: string, signal?: AbortSignal): Promise<{
  gdp: number | null;
  militaryPctGdp: number | null;
  militaryBudgetUsd: number | null;
  population: number | null;
  tradeGdpPct: number | null;
  goldReservesUsd: number | null;
}> {
  const [
    gdpMap, milPctMap, popMap, tradeMap,
    reservesInclGoldMap, reservesExGoldMap,
    milBudgetMap,
  ] = await Promise.all([
    fetchWorldBankIndicator([countryCode], 'NY.GDP.MKTP.CD', 86400, signal),
    fetchWorldBankIndicator([countryCode], 'MS.MIL.XPND.GD.ZS', 86400, signal),
    fetchWorldBankIndicator([countryCode], 'SP.POP.TOTL', 86400, signal),
    fetchWorldBankIndicator([countryCode], 'NE.TRD.GNFS.ZS', 86400, signal),
    fetchWorldBankIndicator([countryCode], 'FI.RES.TOTL.CD', 86400, signal),
    fetchWorldBankIndicator([countryCode], 'FI.RES.XGLD.CD', 86400, signal),
    // Military expenditure in current USD (SIPRI data proxied via World Bank WDI).
    // More recent than our static sipri-military.json; used as the top priority in enrichCountry.
    fetchWorldBankIndicator([countryCode], 'MS.MIL.XPND.CD', 86400, signal),
  ]);

  const reservesInclGold = reservesInclGoldMap.get(countryCode) ?? null;
  const reservesExGold = reservesExGoldMap.get(countryCode) ?? null;
  const goldReservesUsd =
    reservesInclGold !== null && reservesExGold !== null
      ? Math.max(reservesInclGold - reservesExGold, 0)
      : null;

  // IMF fallback for GDP: NGDPD (nominal GDP, billions current USD).
  // Called only when World Bank returns null — avoids extra latency for data-rich countries.
  let gdp = gdpMap.get(countryCode) ?? null;
  if (gdp === null) {
    const imfMap = await fetchIMFIndicator('NGDPD', [countryCode], 86400, signal);
    const imfBillions = imfMap.get(countryCode) ?? null;
    if (imfBillions !== null) gdp = imfBillions * 1e9;
  }

  return {
    gdp,
    militaryPctGdp: milPctMap.get(countryCode) ?? null,
    militaryBudgetUsd: milBudgetMap.get(countryCode) ?? null,
    population: popMap.get(countryCode) ?? null,
    tradeGdpPct: tradeMap.get(countryCode) ?? null,
    goldReservesUsd,
  };
}
