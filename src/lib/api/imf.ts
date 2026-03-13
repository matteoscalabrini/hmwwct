const IMF_BASE = 'https://www.imf.org/external/datamapper/api/v1';

export type IMFIndicatorMap = Map<string, number | null>;

/**
 * Fetch an IMF DataMapper indicator for one or more countries.
 * Returns the most recent year's value for each country.
 */
export async function fetchIMFIndicator(
  indicator: string,
  countryCodes: string[],
  revalidate = 86400,
  signal?: AbortSignal
): Promise<IMFIndicatorMap> {
  const result: IMFIndicatorMap = new Map(countryCodes.map((c) => [c, null]));

  try {
    const codesParam = countryCodes.join(',');
    const url = `${IMF_BASE}/${indicator}/${codesParam}`;
    const res = await fetch(url, { next: { revalidate }, signal });
    if (!res.ok) return result;

    const data = await res.json();
    const values = data?.values?.[indicator];
    if (!values) return result;

    for (const code of countryCodes) {
      const countryData = values[code];
      if (!countryData) continue;

      // Get the most recent non-null year
      const years = Object.keys(countryData).sort((a, b) => Number(b) - Number(a));
      for (const year of years) {
        if (countryData[year] !== null && countryData[year] !== undefined) {
          result.set(code, countryData[year]);
          break;
        }
      }
    }
  } catch {
    // Return nulls on error
  }

  return result;
}
