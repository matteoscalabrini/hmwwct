import { NextResponse } from 'next/server';
import { ConflictScenario } from '@/types';
import { fetchCountryIndicators } from '@/lib/api/worldbank';
import { fetchAllCountries, RestCountryRaw } from '@/lib/api/restcountries';
import { enrichCountry } from '@/lib/utils/enrichCountry';
import { calculateWarCost } from '@/lib/calculations';
import { SCENARIOS } from '@/constants/conflict-scenarios';

const VALID_SCENARIOS = new Set<ConflictScenario>(['skirmish', 'conventional', 'occupation']);

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
    // Parallel fetch: REST Countries metadata + World Bank indicators for both countries
    const [allCountries, aggressorLive, targetLive] = await Promise.all([
      fetchAllCountries(),
      fetchCountryIndicators(aggressorCode),
      fetchCountryIndicators(targetCode),
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

    const result = calculateWarCost({ aggressor, target, scenario });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/calculate]', err);
    return NextResponse.json(
      { error: 'Calculation failed. Please try again.' },
      { status: 500 }
    );
  }
}
