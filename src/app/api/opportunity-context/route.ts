import { NextResponse } from 'next/server';
import { OpportunityContextMetric, Source } from '@/types';
import { fetchWorldBankLatestObservations } from '@/lib/api/worldbank';
import { STRONG_OPPORTUNITY_IDS } from '@/constants/opportunity-focus';

const INDICATORS = {
  population: 'SP.POP.TOTL',
  childPopulationShare: 'SP.POP.0014.TO.ZS',
  hospitalBeds: 'SH.MED.BEDS.ZS',
  nurses: 'SH.MED.NUMW.P3',
  cleanWater: 'SH.H2O.BASW.ZS',
  sanitation: 'SH.STA.BASS.ZS',
  undernourishment: 'SN.ITK.DEFC.ZS',
  forestArea: 'AG.LND.FRST.K2',
} as const;

function worldBankSource(name: string, indicator: string, year: number | null): Source {
  return {
    name,
    url: `https://data.worldbank.org/indicator/${indicator}`,
    indicator,
    year: year ?? new Date().getFullYear(),
    isStatic: false,
  };
}

function formatAsOf(...parts: Array<string | null>): string {
  return parts.filter(Boolean).join(' x ');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetCode = searchParams.get('target')?.toUpperCase();

  if (!targetCode) {
    return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 });
  }
  if (!/^[A-Z]{3}$/.test(targetCode)) {
    return NextResponse.json({ error: 'Invalid target country code' }, { status: 400 });
  }

  try {
    const signal = AbortSignal.timeout(15_000);
    const [
      populationMap,
      childPopulationShareMap,
      bedsMap,
      nursesMap,
      waterMap,
      sanitationMap,
      undernourishmentMap,
      forestMap,
    ] = await Promise.all([
      fetchWorldBankLatestObservations([targetCode], INDICATORS.population, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.childPopulationShare, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.hospitalBeds, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.nurses, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.cleanWater, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.sanitation, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.undernourishment, 86400, signal),
      fetchWorldBankLatestObservations([targetCode], INDICATORS.forestArea, 86400, signal),
    ]);

    const population = populationMap.get(targetCode) ?? { value: null, year: null };
    const childPopulationShare = childPopulationShareMap.get(targetCode) ?? { value: null, year: null };
    const hospitalBeds = bedsMap.get(targetCode) ?? { value: null, year: null };
    const nurses = nursesMap.get(targetCode) ?? { value: null, year: null };
    const cleanWater = waterMap.get(targetCode) ?? { value: null, year: null };
    const sanitation = sanitationMap.get(targetCode) ?? { value: null, year: null };
    const undernourishment = undernourishmentMap.get(targetCode) ?? { value: null, year: null };
    const forestArea = forestMap.get(targetCode) ?? { value: null, year: null };

    const metrics: OpportunityContextMetric[] = [];

    if (population.value !== null && hospitalBeds.value !== null) {
      metrics.push({
        id: 'hospital_beds',
        label: 'Hospital beds',
        currentLabel: 'Current national bed capacity',
        currentValue: (population.value * hospitalBeds.value) / 1000,
        currentUnit: 'beds',
        asOf: formatAsOf(
          hospitalBeds.year ? `${hospitalBeds.year} bed density` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest hospital-bed density and latest population available from the World Bank.',
        sources: [
          worldBankSource('World Bank — Hospital beds (per 1,000 people)', INDICATORS.hospitalBeds, hospitalBeds.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (population.value !== null && nurses.value !== null) {
      metrics.push({
        id: 'nurses',
        label: 'Nurses and midwives',
        currentLabel: 'Current workforce',
        currentValue: (population.value * nurses.value) / 1000,
        currentUnit: 'workers',
        asOf: formatAsOf(
          nurses.year ? `${nurses.year} workforce density` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest nurses-and-midwives density and latest population available from the World Bank.',
        sources: [
          worldBankSource('World Bank — Nurses and midwives (per 1,000 people)', INDICATORS.nurses, nurses.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (population.value !== null && cleanWater.value !== null) {
      metrics.push({
        id: 'clean_water',
        label: 'People with basic drinking water access',
        currentLabel: 'Current population with access',
        currentValue: population.value * (cleanWater.value / 100),
        currentUnit: 'people',
        asOf: formatAsOf(
          cleanWater.year ? `${cleanWater.year} access rate` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest World Bank share of people with at least basic drinking water service.',
        sources: [
          worldBankSource('World Bank — People using at least basic drinking water services (% of population)', INDICATORS.cleanWater, cleanWater.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (population.value !== null && sanitation.value !== null) {
      metrics.push({
        id: 'sanitation_access',
        label: 'People with basic sanitation access',
        currentLabel: 'Current population with access',
        currentValue: population.value * (sanitation.value / 100),
        currentUnit: 'people',
        asOf: formatAsOf(
          sanitation.year ? `${sanitation.year} access rate` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest World Bank share of people with at least basic sanitation service.',
        sources: [
          worldBankSource('World Bank — People using at least basic sanitation services (% of population)', INDICATORS.sanitation, sanitation.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (population.value !== null && undernourishment.value !== null) {
      metrics.push({
        id: 'food_support',
        label: 'Undernourished population',
        currentLabel: 'Current undernourished population',
        currentValue: population.value * (undernourishment.value / 100),
        currentUnit: 'people',
        asOf: formatAsOf(
          undernourishment.year ? `${undernourishment.year} prevalence` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest World Bank prevalence of undernourishment series.',
        sources: [
          worldBankSource('World Bank — Prevalence of undernourishment (% of population)', INDICATORS.undernourishment, undernourishment.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (population.value !== null && childPopulationShare.value !== null) {
      metrics.push({
        id: 'vaccines',
        label: 'Children aged 0-14',
        currentLabel: 'Current child population',
        currentValue: population.value * (childPopulationShare.value / 100),
        currentUnit: 'children',
        asOf: formatAsOf(
          childPopulationShare.year ? `${childPopulationShare.year} child share` : null,
          population.year ? `${population.year} population` : null
        ),
        note: 'Estimated from the latest World Bank share of children aged 0-14 in the population.',
        sources: [
          worldBankSource('World Bank — Population ages 0-14 (% of total)', INDICATORS.childPopulationShare, childPopulationShare.year),
          worldBankSource('World Bank — Population, total', INDICATORS.population, population.year),
        ],
      });
    }

    if (forestArea.value !== null) {
      metrics.push({
        id: 'climate_forests',
        label: 'Forest area',
        currentLabel: 'Current forest cover',
        currentValue: forestArea.value * 100,
        currentUnit: 'hectares',
        asOf: forestArea.year ? `${forestArea.year}` : 'Latest available',
        note: 'Converted from the World Bank forest-area series, reported in square kilometers.',
        sources: [
          worldBankSource('World Bank — Forest area (sq. km)', INDICATORS.forestArea, forestArea.year),
        ],
      });
    }

    const orderedMetrics = STRONG_OPPORTUNITY_IDS
      .map((id) => metrics.find((metric) => metric.id === id))
      .filter((metric): metric is OpportunityContextMetric => metric !== undefined);

    return NextResponse.json(
      {
        metrics: orderedMetrics,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
      }
    );
  } catch (err) {
    console.error('[/api/opportunity-context]', err);
    return NextResponse.json(
      { error: 'Opportunity context lookup failed. Please try again.' },
      { status: 502 }
    );
  }
}
