/**
 * Generates src/lib/data/countries.json — the full selectable-country dataset.
 *
 * Why: REST Countries v3.1 was deprecated in 2026 (v5 requires an API key),
 * which broke /api/countries in production. Country metadata changes ~yearly,
 * so a committed static dataset is more reliable than a live API call.
 *
 * Sources (both keyless):
 *  - mledoze/countries  → name, cca2/cca3, region, subregion, latlng, area, unMember
 *  - World Bank API     → population (SP.POP.TOTL, most recent non-null value)
 *  - flagcdn.com        → flag png/svg URLs (derived from cca2)
 *
 * Run: npm run build:countries
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import extraCountriesData from '../src/lib/data/extra-countries.json';

const MLEDOZE_URL = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';
const WB_POP_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1';

// World Bank does not report SP.POP.TOTL for these — hand-filled from UN estimates.
const POPULATION_OVERRIDES: Record<string, number> = {
  VAT: 882, // UN estimate 2024
};

const EXCLUDED_CODES = new Set([
  'ATA', // Antarctica
  'ATF', // French Southern Territories
  'BVT', // Bouvet Island
  'HMD', // Heard Island
  'SGS', // South Georgia
]);

interface MledozeCountry {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  region: string;
  subregion: string;
  latlng: [number, number];
  area: number;
  unMember: boolean;
}

interface RestCountryRaw {
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function main() {
  console.log('Fetching mledoze/countries dataset...');
  const mledoze = await fetchJson<MledozeCountry[]>(MLEDOZE_URL);

  console.log('Fetching World Bank population (SP.POP.TOTL, latest non-null)...');
  const wbPayload = await fetchJson<[unknown, Array<{ countryiso3code: string; value: number | null }>]>(WB_POP_URL);
  const populationByIso3 = new Map<string, number>();
  for (const rec of wbPayload[1] ?? []) {
    if (rec.value !== null && rec.countryiso3code && !populationByIso3.has(rec.countryiso3code)) {
      populationByIso3.set(rec.countryiso3code, rec.value);
    }
  }

  const countries: RestCountryRaw[] = mledoze
    .filter((c) => c.unMember === true && c.cca3 && c.latlng?.length === 2 && !EXCLUDED_CODES.has(c.cca3))
    .map((c) => ({
      name: { common: c.name.common, official: c.name.official },
      cca2: c.cca2,
      cca3: c.cca3,
      flags: {
        png: `https://flagcdn.com/w320/${c.cca2.toLowerCase()}.png`,
        svg: `https://flagcdn.com/${c.cca2.toLowerCase()}.svg`,
      },
      region: c.region,
      subregion: c.subregion,
      latlng: c.latlng,
      area: c.area,
      unMember: c.unMember,
      population: populationByIso3.get(c.cca3) ?? POPULATION_OVERRIDES[c.cca3] ?? 0,
    }));

  // Merge curated non-UN-member countries (Taiwan, Palestine, Kosovo).
  const present = new Set(countries.map((c) => c.cca3));
  const extras = (extraCountriesData.countries as RestCountryRaw[]).filter((c) => !present.has(c.cca3));
  countries.push(...extras);
  countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

  const missingPop = countries.filter((c) => c.population === 0).map((c) => c.cca3);
  if (missingPop.length > 0) {
    console.warn(`WARNING: no World Bank population for ${missingPop.length} countries:`, missingPop.join(', '));
  }

  const outPath = resolve(__dirname, '../src/lib/data/countries.json');
  writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), countries }, null, 2) + '\n');
  console.log(`Wrote ${countries.length} countries → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
