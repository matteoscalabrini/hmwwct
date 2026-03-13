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
  /** Live WB MS.MIL.XPND.CD — military expenditure in current USD (SIPRI-sourced, more recent than static JSON). */
  militaryBudgetUsd: number | null;
  population: number | null;
  tradeGdpPct: number | null;
  goldReservesUsd: number | null;
}

/**
 * Merge REST Countries metadata with live World Bank indicators and static fallbacks.
 *
 * Military budget priority chain (most → least preferred):
 *   1. Live WB MS.MIL.XPND.CD  — current USD, most recent WB/SIPRI data
 *   2. Static SIPRI JSON        — verified annual figure, may be 1-2 years old
 *   3. Derived: live GDP × live militaryPctGdp
 *   4. Static fallback JSON     — last-resort for data-sparse countries
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
  const goldReservesUsd = live.goldReservesUsd ?? null;

  const militaryBudgetUsd =
    live.militaryBudgetUsd ??
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
    goldReservesUsd,
    dataYear: sipri?.year ?? fallback?.dataYear ?? 2023,
    hasStaticFallback,
  };
}
