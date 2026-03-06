import { CalculationInput, CostCategory, LineItem, OpportunityCostItem, Source } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import opportunityCostsData from '@/lib/data/opportunity-costs.json';

const SOURCES: Record<string, Source> = {
  worldbank_reconstruction: {
    name: 'World Bank — Post-Conflict Reconstruction',
    url: 'https://www.worldbank.org/en/topic/fragilityconflictviolence/brief/post-crisis-and-conflict-recovery',
    year: 2022,
    isStatic: true,
  },
  watson_reconstruction: {
    name: 'Watson Institute — Costs of War: Reconstruction',
    url: 'https://watson.brown.edu/costsofwar/costs/economic',
    year: 2023,
    isStatic: true,
  },
  worldbank_gdp: {
    name: 'World Bank — GDP (current USD)',
    url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD',
    indicator: 'NY.GDP.MKTP.CD',
    year: 2023,
    isStatic: false,
  },
};

export function calculateReconstructionCost(input: CalculationInput): {
  category: CostCategory;
  opportunityCosts: OpportunityCostItem[];
} {
  const { target, scenario } = input;
  const def = SCENARIOS[scenario];

  const targetGdp = target.gdp ?? 100_000_000_000;
  const durationYears = def.durationYears.point;
  const rate = def.reconstructionRate.point;

  // reconstructionRate is an ANNUAL rate; multiply by duration for total cost.
  // This correctly scales short conflicts (Kargil 73 days) vs long occupations (Afghanistan 20yr).
  const reconstructionCost = targetGdp * rate * durationYears;
  const reconstructionMin = targetGdp * def.reconstructionRate.min * durationYears;
  const reconstructionMax = targetGdp * def.reconstructionRate.max * durationYears;

  const items: LineItem[] = [
    {
      label: 'Post-conflict reconstruction',
      amount: reconstructionCost,
      isEstimate: true,
      confidence: scenario === 'skirmish' ? 'medium' : 'low',
      assumptions: [
        {
          id: 'reconstruction-rate',
          description: `Reconstruction cost = ${(rate * 100).toFixed(0)}%/yr of target GDP × ${durationYears}yr (World Bank historical average for ${def.label.toLowerCase()}, range: ${(def.reconstructionRate.min * 100).toFixed(0)}–${(def.reconstructionRate.max * 100).toFixed(0)}%/yr)`,
          formula: `${formatUsd(targetGdp)} × ${rate}/yr × ${durationYears}yr = ${formatUsd(reconstructionCost)}`,
          value: reconstructionCost,
          unit: 'USD',
          sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction],
        },
      ],
      sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction],
    },
  ];

  // --- Opportunity costs (displayed separately, not added to total) ---
  const totalCostContext = reconstructionCost; // Used as reference for opportunity cost widget
  const opportunityCosts = calculateOpportunityCosts(totalCostContext);

  return {
    category: {
      label: 'Reconstruction',
      amount: reconstructionCost,
      amountMin: reconstructionMin,
      amountMax: reconstructionMax,
      color: '#4a5568',
      items,
      methodology: `Reconstruction costs based on World Bank post-conflict studies. For ${def.label.toLowerCase()}, ` +
        `reconstruction typically runs ${(def.reconstructionRate.min * 100).toFixed(0)}–${(def.reconstructionRate.max * 100).toFixed(0)}%/yr of the target nation's GDP × conflict duration. ` +
        `Reference: Afghanistan ~$145B over 20yr (~36%/yr of $20B GDP); Iraq ~$60B over 3yr (~18%/yr of $110B GDP); Kargil ~$0.5B (~0.7% of $80B Pakistan GDP).`,
      sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction, SOURCES.worldbank_gdp],
    },
    opportunityCosts,
  };
}

function calculateOpportunityCosts(totalUsd: number): OpportunityCostItem[] {
  const data = opportunityCostsData as {
    items: Array<{
      id: string;
      label: string;
      iconName: string;
      unitCostUsd: number;
      unit: string;
      description: string;
      sourceNote: string;
    }>;
    metadata: { sources: Array<{ name: string; url: string }>; year: number };
  };

  return data.items.map((item) => ({
    label: item.label,
    iconName: item.iconName,
    quantity: Math.floor(totalUsd / item.unitCostUsd),
    unit: item.unit,
    unitCost: item.unitCostUsd,
    source: {
      name: item.sourceNote,
      url: data.metadata.sources.find((s) => s.name.includes(item.id.split('_')[0]))?.url ??
        'https://www.worldbank.org/',
      year: data.metadata.year,
      isStatic: true,
    },
  }));
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
