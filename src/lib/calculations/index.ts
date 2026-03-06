import { CalculationInput, Source, WarCostResult } from '@/types';
import { haversineKm } from './haversine';
import { calculateMilitaryCost } from './military';
import { calculateEconomicImpact } from './economic';
import { calculateHumanitarianCost } from './humanitarian';
import { calculateReconstructionCost } from './reconstruction';
import { SCENARIOS } from '@/constants/conflict-scenarios';

export function calculateWarCost(input: CalculationInput): WarCostResult {
  const { aggressor, target, scenario } = input;
  const def = SCENARIOS[scenario];
  const distanceKm = haversineKm(aggressor.latlng, target.latlng);

  // Run all four calculation modules
  const militaryCategory = calculateMilitaryCost(input);
  const economicCategory = calculateEconomicImpact(input, distanceKm);
  const { category: humanitarianCategory, humanToll } = calculateHumanitarianCost(input);
  const { category: reconstructionCategory, opportunityCosts } = calculateReconstructionCost(input);

  const point =
    militaryCategory.amount +
    economicCategory.amount +
    humanitarianCategory.amount +
    reconstructionCategory.amount;

  const min =
    militaryCategory.amountMin +
    economicCategory.amountMin +
    humanitarianCategory.amountMin +
    reconstructionCategory.amountMin;

  const max =
    militaryCategory.amountMax +
    economicCategory.amountMax +
    humanitarianCategory.amountMax +
    reconstructionCategory.amountMax;

  // Deduplicated source list
  const allSources: Source[] = deduplicateSources([
    ...militaryCategory.sources,
    ...economicCategory.sources,
    ...humanitarianCategory.sources,
    ...reconstructionCategory.sources,
  ]);

  // All assumptions (from line items across all categories)
  const allAssumptions = [
    ...militaryCategory.items.flatMap((i) => i.assumptions),
    ...economicCategory.items.flatMap((i) => i.assumptions),
    ...humanitarianCategory.items.flatMap((i) => i.assumptions),
    ...reconstructionCategory.items.flatMap((i) => i.assumptions),
  ];

  return {
    total: { min, max, point },
    breakdown: {
      military: militaryCategory,
      economic: economicCategory,
      humanitarian: humanitarianCategory,
      reconstruction: reconstructionCategory,
    },
    duration: {
      min: def.durationYears.min,
      max: def.durationYears.max,
      point: def.durationYears.point,
      unit: 'years',
    },
    humanToll,
    assumptions: allAssumptions,
    sources: allSources,
    opportunityCosts,
    calculatedAt: new Date().toISOString(),
    dataFreshness: {
      worldBank: aggressor.hasStaticFallback || target.hasStaticFallback
        ? 'Some values from static fallback dataset'
        : 'Live — World Bank API (data updated monthly)',
      sipri: 'SIPRI Military Expenditure Database 2023',
      unhcr: 'UNHCR POPSTATS 2023',
    },
  };
}

function deduplicateSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = s.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
