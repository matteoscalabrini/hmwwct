import { Country } from '@/types';
import { RestCountryRaw } from '@/lib/api/restcountries';
import sipriData from '@/lib/data/sipri-military.json';
import staticFallback from '@/lib/data/static-fallback.json';

interface SipriEntry {
  expenditureUsd: number | null;
  pctGdp: number | null;
  personnel: number | null;
  year: number;
}

interface FallbackEntry {
  gdp: number | null;
  population: number | null;
  militaryPctGdp: number | null;
  militaryBudgetUsd: number | null;
  tradeGdpPct: number | null;
  dataYear: number;
}

interface LiveIndicators {
  gdp: number | null;
  militaryPctGdp: number | null;
  population: number | null;
  tradeGdpPct: number | null;
}

/**
 * Merge REST Countries metadata with live World Bank indicators and static fallbacks.
 * Priority: World Bank API → SIPRI static → static fallback → null
 */
export function enrichCountry(
  raw: RestCountryRaw,
  live: LiveIndicators
): Country {
  const code = raw.cca3;
  const sipri = (sipriData as { countries: Record<string, SipriEntry> }).countries[code];
  const fallback = (staticFallback as { countries: Record<string, FallbackEntry> }).countries[code];

  const gdp = live.gdp ?? fallback?.gdp ?? null;
  const militaryPctGdp = live.militaryPctGdp ?? sipri?.pctGdp ?? fallback?.militaryPctGdp ?? null;
  const population = live.population ?? raw.population ?? fallback?.population ?? null;
  const tradeGdpPct = live.tradeGdpPct ?? fallback?.tradeGdpPct ?? null;

  const militaryBudgetUsd =
    sipri?.expenditureUsd ??
    (gdp && militaryPctGdp ? gdp * (militaryPctGdp / 100) : fallback?.militaryBudgetUsd ?? null);

  const hasStaticFallback =
    live.gdp === null ||
    live.militaryPctGdp === null ||
    live.population === null;

  return {
    code,
    code2: raw.cca2,
    name: raw.name.common,
    flag: raw.flags.png,
    flagSvg: raw.flags.svg,
    region: raw.region,
    subregion: raw.subregion ?? '',
    latlng: raw.latlng,
    area: raw.area,
    gdp,
    population,
    militaryBudgetUsd,
    militaryPctGdp,
    militaryPersonnel: sipri?.personnel ?? null,
    tradeGdpPct,
    dataYear: sipri?.year ?? fallback?.dataYear ?? 2023,
    hasStaticFallback,
  };
}
