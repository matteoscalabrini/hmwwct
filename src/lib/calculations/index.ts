import { CalculationInput, Source, WarCostResult } from '@/types';
import { haversineKm } from './haversine';
import { calculateMilitaryCost } from './military';
import { calculateEconomicImpact } from './economic';
import { calculateHumanitarianCost } from './humanitarian';
import { calculateReconstructionCost } from './reconstruction';
import { calculateRevenue } from './revenue';
import { calculateArmamentCost } from './armaments';
import { SCENARIOS } from '@/constants/conflict-scenarios';

export function calculateWarCost(input: CalculationInput): WarCostResult {
  const { aggressor, target, scenario } = input;
  const def = SCENARIOS[scenario];
  const distanceKm = haversineKm(aggressor.latlng, target.latlng);

  // Run all calculation modules
  const militaryCategory = calculateMilitaryCost(input);
  const economicCategory = calculateEconomicImpact(input, distanceKm);
  const { category: humanitarianCategory, humanToll } = calculateHumanitarianCost(input);
  const { category: reconstructionCategory, opportunityCosts } = calculateReconstructionCost(input);
  const armamentsCategory = calculateArmamentCost(input);

  const directPoint =
    militaryCategory.amount +
    humanitarianCategory.amount +
    reconstructionCategory.amount +
    armamentsCategory.amount;

  const directMin =
    militaryCategory.amountMin +
    humanitarianCategory.amountMin +
    reconstructionCategory.amountMin +
    armamentsCategory.amountMin;

  const directMax =
    militaryCategory.amountMax +
    humanitarianCategory.amountMax +
    reconstructionCategory.amountMax +
    armamentsCategory.amountMax;

  const revenue = calculateRevenue(input, directPoint);

  // Deduplicated source list
  const allSources: Source[] = deduplicateSources([
    ...militaryCategory.sources,
    ...economicCategory.sources,
    ...humanitarianCategory.sources,
    ...reconstructionCategory.sources,
    ...armamentsCategory.sources,
  ]);

  // All assumptions (from line items across all categories)
  const allAssumptions = [
    ...militaryCategory.items.flatMap((i) => i.assumptions),
    ...economicCategory.items.flatMap((i) => i.assumptions),
    ...humanitarianCategory.items.flatMap((i) => i.assumptions),
    ...reconstructionCategory.items.flatMap((i) => i.assumptions),
    ...armamentsCategory.items.flatMap((i) => i.assumptions),
  ];

  return {
    total: { min: directMin, max: directMax, point: directPoint },
    economicImpact: {
      min: economicCategory.amountMin,
      max: economicCategory.amountMax,
      point: economicCategory.amount,
    },
    revenue,
    breakdown: {
      military: militaryCategory,
      economic: economicCategory,
      humanitarian: humanitarianCategory,
      reconstruction: reconstructionCategory,
      armaments: armamentsCategory,
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
        ? 'Some values from static fallback dataset; IMF DataMapper used as secondary source'
        : 'Live — World Bank API (monthly); IMF DataMapper fallback for data-sparse countries',
      sipri: 'SIPRI Military Expenditure Database 2023',
      unhcr: 'UNHCR POPSTATS 2023',
      ...(input.liveData?.bilateralTrade
        ? { comtrade: `Live bilateral trade from UN Comtrade API (${input.liveData.bilateralTrade.year}; fetched ${input.liveData.bilateralTrade.fetchedAt.slice(0, 10)})` }
        : {}),
      ...(input.liveData?.acledSignal
        ? { acled: `Live ACLED political-violence events (${input.liveData.acledSignal.lookbackDays}d lookback; fetched ${input.liveData.acledSignal.fetchedAt.slice(0, 10)})` }
        : {}),
      ...(input.liveData?.commodityPrices?.oilUsdPerBarrel !== null ||
        input.liveData?.commodityPrices?.gasUsdPerMmbtu !== null ||
        input.liveData?.commodityPrices?.wheatUsdPerTon !== null
        ? { fred: `Live commodity prices from FRED (fetched ${input.liveData?.commodityPrices?.fetchedAt?.slice(0, 10) ?? 'today'})` }
        : {}),
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
