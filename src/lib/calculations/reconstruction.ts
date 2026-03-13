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

  // Reconstruction has physical costs that scale sublinearly with GDP.
  // Calibrated at Afghanistan ($20B GDP); richer countries are dampened.
  // Formula: effectiveGdp = REFERENCE^(1-α) × GDP^α, where α = 0.85
  // At $20B GDP → effectiveGdp = $20B (no change). At $4T → ~$1.7T instead of $4T.
  const RECONSTRUCTION_REFERENCE_GDP = 20_000_000_000; // Afghanistan calibration point
  const GDP_DAMPENING_ALPHA = 0.85;
  const effectiveGdp = Math.pow(RECONSTRUCTION_REFERENCE_GDP, 1 - GDP_DAMPENING_ALPHA) * Math.pow(targetGdp, GDP_DAMPENING_ALPHA);

  // reconstructionRate is an ANNUAL rate; multiply by duration for total cost.
  // This correctly scales short conflicts (Kargil 73 days) vs long occupations (Afghanistan 20yr).
  // Overlap discount: ~30% of reconstruction need is already reflected in the GDP contraction
  // computed by the economic module (destruction → lost output → GDP drop).
  const RECONSTRUCTION_OVERLAP_DISCOUNT = 0.70;
  const reconstructionCost = effectiveGdp * rate * durationYears * RECONSTRUCTION_OVERLAP_DISCOUNT;
  const reconstructionMin = effectiveGdp * def.reconstructionRate.min * durationYears * RECONSTRUCTION_OVERLAP_DISCOUNT;
  const reconstructionMax = effectiveGdp * def.reconstructionRate.max * durationYears * RECONSTRUCTION_OVERLAP_DISCOUNT;

  // World Bank post-conflict sector allocation (avg across Syria, Iraq, Afghanistan, Bosnia studies)
  const infraCost      = reconstructionCost * 0.40; // roads, bridges, utilities, communications
  const housingCost    = reconstructionCost * 0.30; // residential, temporary shelters → permanent
  const servicesCost   = reconstructionCost * 0.20; // schools, hospitals, government institutions
  const economicRecovery = reconstructionCost * 0.10; // SME support, agriculture, market re-integration

  const confidence: LineItem['confidence'] = scenario === 'skirmish' ? 'medium' : 'low';
  const rateNote = `${(rate * 100).toFixed(0)}%/yr of effective GDP (${formatUsd(effectiveGdp)}, dampened from ${formatUsd(targetGdp)}) × ${durationYears}yr × 0.70 overlap discount (World Bank range: ${(def.reconstructionRate.min * 100).toFixed(0)}–${(def.reconstructionRate.max * 100).toFixed(0)}%/yr for ${def.label.toLowerCase()})`;

  const items: LineItem[] = [
    {
      label: 'Infrastructure repair & rebuild',
      amount: infraCost,
      isEstimate: true,
      confidence,
      assumptions: [
        {
          id: 'infra-reconstruction',
          description: `Infrastructure = 40% of total reconstruction (World Bank post-conflict studies: roads, bridges, power grids, water/sanitation, telecommunications). ${rateNote}`,
          formula: `${formatUsd(reconstructionCost)} × 40% = ${formatUsd(infraCost)}`,
          value: infraCost,
          unit: 'USD',
          sources: [SOURCES.worldbank_reconstruction],
        },
      ],
      sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction],
    },
    {
      label: 'Housing & shelter reconstruction',
      amount: housingCost,
      isEstimate: true,
      confidence,
      assumptions: [
        {
          id: 'housing-reconstruction',
          description: `Housing = 30% of total reconstruction (World Bank: temporary shelters, transitional housing, permanent reconstruction for displaced population). ${rateNote}`,
          formula: `${formatUsd(reconstructionCost)} × 30% = ${formatUsd(housingCost)}`,
          value: housingCost,
          unit: 'USD',
          sources: [SOURCES.worldbank_reconstruction],
        },
      ],
      sources: [SOURCES.worldbank_reconstruction],
    },
    {
      label: 'Public services (health, education, governance)',
      amount: servicesCost,
      isEstimate: true,
      confidence,
      assumptions: [
        {
          id: 'services-reconstruction',
          description: `Public services = 20% of total reconstruction (schools, hospitals, courts, public administration — UN/World Bank joint assessment methodology). ${rateNote}`,
          formula: `${formatUsd(reconstructionCost)} × 20% = ${formatUsd(servicesCost)}`,
          value: servicesCost,
          unit: 'USD',
          sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction],
        },
      ],
      sources: [SOURCES.worldbank_reconstruction, SOURCES.watson_reconstruction],
    },
    {
      label: 'Economic recovery & livelihoods',
      amount: economicRecovery,
      isEstimate: true,
      confidence: 'low',
      assumptions: [
        {
          id: 'economic-recovery',
          description: `Economic recovery = 10% of total reconstruction (SME grants, agricultural rehabilitation, trade facilitation, market re-integration — World Bank FCV strategy). ${rateNote}`,
          formula: `${formatUsd(reconstructionCost)} × 10% = ${formatUsd(economicRecovery)}`,
          value: economicRecovery,
          unit: 'USD',
          sources: [SOURCES.worldbank_reconstruction],
        },
      ],
      sources: [SOURCES.worldbank_reconstruction],
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
        `reconstruction typically runs ${(def.reconstructionRate.min * 100).toFixed(0)}–${(def.reconstructionRate.max * 100).toFixed(0)}%/yr of the target nation's effective GDP × conflict duration. ` +
        `GDP base dampened for wealthy nations (sublinear physical-cost scaling, calibrated at Afghanistan $20B GDP). ` +
        `30% overlap discount applied — GDP contraction in the Economic module already partially captures destruction costs. ` +
        `Sector allocation follows World Bank post-conflict assessments (Syria, Iraq, Afghanistan, Bosnia): infrastructure 40%, housing 30%, public services 20%, economic recovery 10%. ` +
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
    id: item.id,
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
