import { CommodityPrices } from '@/types';

const FRED_BASE = 'https://api.stlouisfed.org/fred';

/**
 * Fetch the most recent non-null observation for a FRED series.
 * Requests up to 10 latest observations in descending order (handles weekends/holidays
 * where the latest date may have a "." placeholder).
 */
async function fetchFredSeries(seriesId: string, apiKey: string, signal?: AbortSignal): Promise<number | null> {
  try {
    const url =
      `${FRED_BASE}/series/observations` +
      `?series_id=${seriesId}&api_key=${apiKey}&limit=10&sort_order=desc&file_type=json`;
    const res = await fetch(url, { next: { revalidate: 3600 }, signal }); // cache 1 hour
    if (!res.ok) return null;

    const data = (await res.json()) as { observations: Array<{ value: string }> };
    for (const obs of data.observations ?? []) {
      const val = parseFloat(obs.value);
      if (!isNaN(val)) return val;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch live commodity spot prices from the St. Louis Fed (FRED).
 *
 * Series used:
 *   DCOILWTICO  — WTI crude oil ($/barrel, daily)
 *   DHHNGSP     — Henry Hub natural gas ($/MMBtu, weekly)
 *   PWHEAMTUSDM — Global wheat price ($/metric ton, monthly)
 *
 * Requires FRED_API_KEY env variable (free registration at https://fred.stlouisfed.org/docs/api/api_key.html).
 * Gracefully degrades to null values when the key is absent or any fetch fails.
 *
 * The 2023 baseline prices that commodity-producers.json was calibrated against:
 *   Oil  ~$80/bbl  ·  Gas  ~$2.50/MMBtu  ·  Wheat  ~$225/t
 * The economic module scales static shocks by (livePrice / baseline).
 */
export async function fetchCommodityPrices(signal?: AbortSignal): Promise<CommodityPrices> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return {
      oilUsdPerBarrel: null,
      gasUsdPerMmbtu: null,
      wheatUsdPerTon: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  const [oilUsdPerBarrel, gasUsdPerMmbtu, wheatUsdPerTon] = await Promise.all([
    fetchFredSeries('DCOILWTICO', apiKey, signal),
    fetchFredSeries('DHHNGSP', apiKey, signal),
    fetchFredSeries('PWHEAMTUSDM', apiKey, signal),
  ]);

  return {
    oilUsdPerBarrel,
    gasUsdPerMmbtu,
    wheatUsdPerTon,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch the US CPI (CPIAUCSL) and return a scalar relative to the 2023 annual average.
 *
 * Watson Institute military cost anchors are expressed in 2023 USD (CPI baseline = 304.7).
 * Applying this scalar to the daily anchors keeps estimates current as inflation accrues.
 *
 * Returns 1.0 (no scaling) when the FRED key is absent or the fetch fails.
 */
export async function fetchCpiScalar(signal?: AbortSignal): Promise<number> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return 1.0;

  // CPIAUCSL 2023 annual average (BLS; this constant does not change)
  const CPI_2023_BASELINE = 304.7;

  const currentCpi = await fetchFredSeries('CPIAUCSL', apiKey, signal);
  if (currentCpi === null || currentCpi <= 0) return 1.0;

  // Cap scalar to a reasonable range (±40% of baseline) to guard against data anomalies
  const raw = currentCpi / CPI_2023_BASELINE;
  return Math.min(Math.max(raw, 0.6), 1.4);
}
