import { NextResponse } from 'next/server';
import { ConflictScenario, SanctionsInfo } from '@/types';
import { fetchCountryIndicators } from '@/lib/api/worldbank';
import { fetchAllCountries, RestCountryRaw } from '@/lib/api/restcountries';
import { enrichCountry } from '@/lib/utils/enrichCountry';
import { calculateWarCost } from '@/lib/calculations';
import { fetchCommodityPrices, fetchCpiScalar } from '@/lib/api/fred';
import { fetchComtradeBilateralTrade } from '@/lib/api/comtrade';
import { fetchAcledConflictSignal } from '@/lib/api/acled';
import sanctionsData from '@/lib/data/sanctions-regimes.json';

const VALID_SCENARIOS = new Set<ConflictScenario>(['precision_strike', 'skirmish', 'conventional', 'occupation']);

/** Resolve sanctions data for the aggressor from our static literature-based dataset. */
function resolveSanctions(aggressorCode: string): SanctionsInfo | null {
  const entry = (sanctionsData.countries as Record<string, {
    regime: string;
    additionalWarSanctionsPct: number;
    note: string;
  }>)[aggressorCode];
  if (!entry) return null;
  return {
    regime: entry.regime,
    additionalWarSanctionsPct: entry.additionalWarSanctionsPct,
    note: entry.note,
  };
}

export async function POST(req: Request) {
  let body: { aggressorCode: string; targetCode: string; scenario: ConflictScenario };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { aggressorCode, targetCode, scenario } = body;

  if (!aggressorCode || !targetCode || !scenario) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!VALID_SCENARIOS.has(scenario)) {
    return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 });
  }
  if (aggressorCode === targetCode) {
    return NextResponse.json({ error: 'Aggressor and target must be different countries' }, { status: 400 });
  }

  try {
    // 15s timeout signal — passed into every external fetch so the underlying HTTP
    // connections are actually aborted (not just a wrapper promise).
    const signal = AbortSignal.timeout(15_000);

    const [allCountries, aggressorLive, targetLive, commodityPrices, cpiScalar] = await Promise.all([
      fetchAllCountries(signal),
      fetchCountryIndicators(aggressorCode, signal),
      fetchCountryIndicators(targetCode, signal),
      fetchCommodityPrices(signal).catch(() => undefined),
      fetchCpiScalar(signal).catch(() => 1.0),
    ]);

    const countriesMap = new Map<string, RestCountryRaw>(allCountries.map((c) => [c.cca3, c]));

    const aggressorRaw = countriesMap.get(aggressorCode);
    const targetRaw = countriesMap.get(targetCode);

    if (!aggressorRaw) {
      return NextResponse.json({ error: `Country not found: ${aggressorCode}` }, { status: 404 });
    }
    if (!targetRaw) {
      return NextResponse.json({ error: `Country not found: ${targetCode}` }, { status: 404 });
    }

    const aggressor = enrichCountry(aggressorRaw, aggressorLive);
    const target = enrichCountry(targetRaw, targetLive);

    const [bilateralTrade, acledSignal] = await Promise.all([
      fetchComtradeBilateralTrade(aggressorCode, targetCode, signal).catch(() => null),
      fetchAcledConflictSignal(target.name, signal).catch(() => null),
    ]);

    // Sanctions resolved from static literature-based dataset — no extra network call
    const aggressorSanctions = resolveSanctions(aggressorCode);

    const result = calculateWarCost({
      aggressor,
      target,
      scenario,
      liveData: {
        commodityPrices,
        bilateralTrade,
        acledSignal,
        aggressorSanctions,
        cpiScalar,
      },
    });

    return NextResponse.json({
      ...result,
      inputs: {
        aggressorGdp: aggressor.gdp,
        aggressorPopulation: aggressor.population,
        targetGdp: target.gdp,
        targetPopulation: target.population,
        aggressorName: aggressor.name,
        targetName: target.name,
      },
    });
  } catch (err) {
    console.error('[/api/calculate]', err);
    return NextResponse.json(
      { error: 'Calculation failed. Please try again.' },
      { status: 500 }
    );
  }
}
