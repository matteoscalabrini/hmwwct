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
  const displacedPoint = Math.round(population * totalDisplacementRatio * def.displacementMultiplier);
  const displacedMin = Math.round(displacedPoint * 0.5);
  const displacedMax = Math.round(displacedPoint * 1.8);

  // Displacement outlasts the conflict. For long conflicts the tail is ~2yr (UNHCR average);
  // for short skirmishes displacement is largely resolved during or shortly after the conflict.
  // Formula: add up to 2 years post-conflict tail, scaled to conflict length.
  const displacementDuration = durationYears + Math.min(durationYears * 1.5, 2);

  const costPerPersonPerYear =
    UNHCR_COST_PER_DISPLACED_PER_YEAR_USD + WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD;

  const displacementCost = displacedPoint * costPerPersonPerYear * displacementDuration;

  const items: LineItem[] = [
    {
      label: 'Displacement & refugee resettlement',
      amount: displacementCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'displaced-persons',
          description: `Estimated displaced persons = ${target.name} population × ${(totalDisplacementRatio * def.displacementMultiplier * 100).toFixed(1)}% (UNHCR ${target.code in (displacementData.countries) ? 'country-specific' : 'regional'} ratio × ${def.displacementMultiplier}× scenario multiplier)`,
          formula: `${formatNum(population)} × ${(totalDisplacementRatio).toFixed(3)} × ${def.displacementMultiplier} = ${formatNum(displacedPoint)} people`,
          value: displacedPoint,
          unit: 'people',
          sources: [SOURCES.unhcr, SOURCES.worldbank_pop],
        },
        {
          id: 'cost-per-displaced',
          description: `Cost per displaced person per year: $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} resettlement (UNHCR) + $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} healthcare (WHO). Duration: conflict (${durationYears}yr) + post-conflict tail (${(displacementDuration - durationYears).toFixed(1)}yr)`,
          formula: `($${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} + $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}) × ${displacementDuration.toFixed(1)} years = $${(costPerPersonPerYear * displacementDuration).toLocaleString()}/person`,
          value: costPerPersonPerYear * displacementDuration,
          unit: 'USD/person',
          sources: [SOURCES.unhcr, SOURCES.who],
        },
      ],
      sources: [SOURCES.unhcr, SOURCES.who, SOURCES.worldbank_pop],
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
      methodology: `Humanitarian costs include displacement and emergency healthcare. Estimated ${formatNum(displacedPoint)} people displaced ` +
        `(${(totalDisplacementRatio * def.displacementMultiplier * 100).toFixed(1)}% of population) based on UNHCR historical ratios for comparable conflicts. ` +
        `Displacement costs persist for the conflict duration plus 2 years (UNHCR average return timeline). ` +
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
