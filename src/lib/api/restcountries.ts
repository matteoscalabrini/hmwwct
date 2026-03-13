const RC_BASE = 'https://restcountries.com/v3.1';

export interface RestCountryRaw {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  flags: { png: string; svg: string };
  region: string;
  subregion: string;
  latlng: [number, number];
  area: number;
  unMember: boolean;
  population: number;
}

const EXCLUDED_CODES = new Set([
  'ATA', // Antarctica
  'ATF', // French Southern Territories
  'BVT', // Bouvet Island
  'HMD', // Heard Island
  'SGS', // South Georgia
]);

// Important non-UN-member countries to supplement the REST Countries list.
// Taiwan and Kosovo are geopolitically significant but excluded from UN membership filter.
import extraCountriesData from '@/lib/data/extra-countries.json';

/**
 * Fetch all sovereign UN member states plus curated non-UN-member countries.
 * Cached for 1 week — this data rarely changes.
 * NOTE: REST Countries API v3 allows max 10 fields.
 */
export async function fetchAllCountries(signal?: AbortSignal): Promise<RestCountryRaw[]> {
  // Exactly 10 fields (API limit)
  const fields = 'cca2,cca3,name,flags,region,subregion,latlng,area,unMember,population';
  const res = await fetch(`${RC_BASE}/all?fields=${fields}`, {
    next: { revalidate: 604800 }, // 1 week
    signal,
  });
  if (!res.ok) throw new Error(`REST Countries API error: ${res.status}`);
  const data: RestCountryRaw[] = await res.json();

  const apiCountries = data.filter(
    (c) =>
      c.unMember === true &&
      c.cca3 &&
      c.latlng?.length === 2 &&
      !EXCLUDED_CODES.has(c.cca3)
  );

  // Merge in curated non-UN-member countries
  const extraCodes = new Set(apiCountries.map((c) => c.cca3));
  const extras = (extraCountriesData.countries as RestCountryRaw[]).filter(
    (c) => !extraCodes.has(c.cca3)
  );

  return [...apiCountries, ...extras].sort((a, b) =>
    a.name.common.localeCompare(b.name.common)
  );
}
