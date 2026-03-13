import { CalculationInput, CostCategory, HumanToll, LineItem, Source } from '@/types';
import { SCENARIOS, UNHCR_COST_PER_DISPLACED_PER_YEAR_USD, WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD } from '@/constants/conflict-scenarios';
import displacementData from '@/lib/data/displacement-ratios.json';

const SOURCES: Record<string, Source> = {
  unhcr: {
    name: 'UNHCR Global Trends 2023',
    url: 'https://www.unhcr.org/global-trends',
    year: 2023,
    isStatic: true,
  },
  who: {
    name: 'WHO — Emergency Health Financing',
    url: 'https://www.who.int/emergencies/funding',
    year: 2023,
    isStatic: true,
  },
  worldbank_pop: {
    name: 'World Bank — Population, total',
    url: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
    indicator: 'SP.POP.TOTL',
    year: 2023,
    isStatic: false,
  },
};

interface DisplacementRatio { idpRatio: number; refugeeRatio: number; }

function getDisplacementRatio(targetCode: string, region: string): DisplacementRatio {
  const data = displacementData as {
    countries: Record<string, DisplacementRatio & { note?: string }>;
    regionalDefaults: Record<string, DisplacementRatio>;
  };

  return (
    data.countries[targetCode] ??
    data.regionalDefaults[region] ??
    data.regionalDefaults['default']
  );
}

export function calculateHumanitarianCost(input: CalculationInput): {
  category: CostCategory;
  humanToll: HumanToll;
} {
  const { target, scenario } = input;
  const def = SCENARIOS[scenario];
  const durationYears = def.durationYears.point;

  const population = target.population ?? 10_000_000;
  const ratios = getDisplacementRatio(target.code, target.region);

  const totalDisplacementRatio = ratios.idpRatio + ratios.refugeeRatio;

  // For skirmishes, displacement is localized — large countries have proportionally less
  // of their population affected. Apply a dampening factor based on country area.
  // Reference: ~100,000 km² (approximate conflict-affected zone for a border skirmish).
  // Countries smaller than this threshold are fully affected; larger ones are dampened.
  const SKIRMISH_AFFECTED_AREA_KM2 = 100_000;
  let populationAtRisk = population;
  if (scenario === 'skirmish' && target.area > SKIRMISH_AFFECTED_AREA_KM2) {
    const areaFraction = SKIRMISH_AFFECTED_AREA_KM2 / target.area;
    // Use sqrt to avoid over-dampening (population isn't uniformly distributed)
    populationAtRisk = population * Math.sqrt(areaFraction);
  }

  const displacedPoint = Math.round(populationAtRisk * totalDisplacementRatio * def.displacementMultiplier);
  const displacedMin = Math.round(displacedPoint * 0.5);
  const displacedMax = Math.round(displacedPoint * 1.8);

  // Displacement outlasts the conflict. For long conflicts the tail is ~2yr (UNHCR average);
  // for short skirmishes displacement is largely resolved during or shortly after the conflict.
  // Formula: add up to 2 years post-conflict tail, scaled to conflict length.
  const displacementDuration = durationYears + Math.min(durationYears * 1.5, 2);

  const costPerPersonPerYear =
    UNHCR_COST_PER_DISPLACED_PER_YEAR_USD + WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD;

  const displacementCost = displacedPoint * costPerPersonPerYear * displacementDuration;

  // Split displaced population into IDPs vs cross-border refugees for sub-item breakdown
  const idpFraction = totalDisplacementRatio > 0 ? ratios.idpRatio / totalDisplacementRatio : 0.6;
  const refugeeFraction = totalDisplacementRatio > 0 ? ratios.refugeeRatio / totalDisplacementRatio : 0.4;
  const idpCount = Math.round(displacedPoint * idpFraction);
  const refugeeCount = displacedPoint - idpCount;

  const idpCost     = idpCount     * UNHCR_COST_PER_DISPLACED_PER_YEAR_USD * displacementDuration;
  const refugeeCost = refugeeCount * UNHCR_COST_PER_DISPLACED_PER_YEAR_USD * displacementDuration;
  const healthcareCost = displacedPoint * WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD * displacementDuration;

  const ratioSource = target.code in (displacementData as { countries: Record<string, unknown> }).countries ? 'country-specific' : 'regional';

  const items: LineItem[] = [
    {
      label: 'Internally displaced persons (IDP) support',
      amount: idpCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'idp-support',
          description: `${formatNum(idpCount)} IDPs (${(idpFraction * 100).toFixed(0)}% of displaced, UNHCR ${ratioSource} ratio${populationAtRisk < population ? `; displacement scaled to ${formatNum(populationAtRisk)} population-at-risk in conflict zone` : ''}). Shelter, food, WASH, protection: $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(idpCount)} × $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(idpCost)}`,
          value: idpCost,
          unit: 'USD',
          sources: [SOURCES.unhcr, SOURCES.worldbank_pop],
        },
      ],
      sources: [SOURCES.unhcr, SOURCES.worldbank_pop],
    },
    {
      label: 'Cross-border refugee resettlement',
      amount: refugeeCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'refugee-resettlement',
          description: `${formatNum(refugeeCount)} cross-border refugees (${(refugeeFraction * 100).toFixed(0)}% of displaced, UNHCR ${ratioSource} ratio${populationAtRisk < population ? `; displacement scaled to ${formatNum(populationAtRisk)} population-at-risk in conflict zone` : ''}). Host-country resettlement, legal status, integration: $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(refugeeCount)} × $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(refugeeCost)}`,
          value: refugeeCost,
          unit: 'USD',
          sources: [SOURCES.unhcr],
        },
      ],
      sources: [SOURCES.unhcr],
    },
    {
      label: 'Emergency healthcare & trauma response',
      amount: healthcareCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'emergency-healthcare',
          description: `Emergency health costs for all ${formatNum(displacedPoint)} displaced persons${populationAtRisk < population ? ` (from ${formatNum(populationAtRisk)} population-at-risk in conflict zone)` : ''}: $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr (WHO Emergency Health Financing). Covers trauma surgery, disease surveillance, mental health, and primary care over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(displacedPoint)} × $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(healthcareCost)}`,
          value: healthcareCost,
          unit: 'USD',
          sources: [SOURCES.who],
        },
      ],
      sources: [SOURCES.who],
    },
  ];

  const humanToll: HumanToll = {
    displacedPersonsPoint: displacedPoint,
    displacedPersonsMin: displacedMin,
    displacedPersonsMax: displacedMax,
    source: SOURCES.unhcr,
    note: 'Displacement estimates based on UNHCR historical ratios for similar conflicts. Casualties are not monetized — this number represents the human toll, not a dollar figure.',
  };

  return {
    category: {
      label: 'Humanitarian',
      amount: displacementCost,
      amountMin: displacedMin * costPerPersonPerYear * displacementDuration,
      amountMax: displacedMax * costPerPersonPerYear * displacementDuration,
      color: '#b45309',
      items,
      methodology: `Humanitarian costs include IDP support, cross-border refugee resettlement, and emergency healthcare for ${formatNum(displacedPoint)} displaced persons ` +
        `(${(totalDisplacementRatio * def.displacementMultiplier * 100).toFixed(1)}% of ${populationAtRisk < population ? `${formatNum(populationAtRisk)} population-at-risk` : `${target.name}'s population`}, UNHCR ${ratioSource} ratio × ${def.displacementMultiplier}× scenario multiplier` +
        `${populationAtRisk < population ? `; area-dampened from ${formatNum(population)} total pop — skirmish affects ~${(SKIRMISH_AFFECTED_AREA_KM2 / 1000).toFixed(0)}K km² of ${formatNum(target.area)} km² total` : ''}). ` +
        `Split: ${formatNum(idpCount)} IDPs and ${formatNum(refugeeCount)} cross-border refugees ($${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr each) plus WHO emergency healthcare ($${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr for all displaced). ` +
        `Duration: ${durationYears}yr conflict + ${(displacementDuration - durationYears).toFixed(1)}yr post-conflict tail (UNHCR average return timeline). ` +
        `NOTE: Casualty estimates are shown separately and are NOT monetized.`,
      sources: [SOURCES.unhcr, SOURCES.who, SOURCES.worldbank_pop],
    },
    humanToll,
  };
}

function formatNum(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

function formatUsdH(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
