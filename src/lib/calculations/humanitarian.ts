import { CalculationInput, CostCategory, HumanToll, LineItem, Source } from '@/types';
import { SCENARIOS, UNHCR_COST_PER_DISPLACED_PER_YEAR_USD, WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD } from '@/constants/conflict-scenarios';
import displacementData from '@/lib/data/displacement-ratios.json';

// ─── Casualty cost constants ──────────────────────────────────────────────────
// Value of Statistical Life (VSL) by income group — used to monetize casualties.
// This follows WHO and World Bank health-economics methodology (not a moral valuation).
// High-income country VSL: ~$10M (US EPA benchmark)
// Upper-middle: ~$3M | Lower-middle: ~$1M | Low-income: ~$500K
// We use GDP per capita × ~100 as a rough proxy (WHO "human capital" method).
// Iran: ~$5,000 GDP/capita × 100 = $500K per statistical life.

// Daily casualty rates (killed per million population) calibrated from real conflicts:
// Iran 2026 air campaign: 1,444 killed in 17 days, population 89M → 0.95/M/day
// Kosovo 1999: ~13,000 killed over 78 days, population 2M → 83/M/day (civil war context)
// Iraq 2003 invasion (21 days): ~7,000 civilians killed, pop 26M → 12.8/M/day
// We use a conservative estimate for the air_campaign scenario calibrated to Iran 2026.
const DAILY_CASUALTIES_PER_MILLION: Record<string, { killed: number; injured: number }> = {
  precision_strike: { killed: 0.2,  injured: 1.5  }, // mostly military targets, few days
  air_campaign:     { killed: 1.0,  injured: 8.0  }, // Iran 2026 calibration
  skirmish:         { killed: 1.5,  injured: 10.0 }, // ground contact, more casualties
  conventional:     { killed: 5.0,  injured: 35.0 }, // full war — Iraq 2003 calibration
  occupation:       { killed: 0.8,  injured: 5.0  }, // insurgency / low-intensity sustained
};

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
  csis_iran: {
    name: 'CSIS — "$3.7 Billion: Estimated Cost of Epic Fury\'s First 100 Hours" (2026)',
    url: 'https://www.csis.org/analysis/37-billion-estimated-cost-epic-furys-first-100-hours',
    year: 2026,
    isStatic: true,
  },
  worldbank_pop: {
    name: 'World Bank — Population, total',
    url: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
    indicator: 'SP.POP.TOTL',
    year: 2023,
    isStatic: false,
  },
  acled: {
    name: 'ACLED API — Political Violence Events',
    url: 'https://acleddata.com/api-documentation/acled-endpoint/',
    year: new Date().getFullYear(),
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
  const acledSignal = input.liveData?.acledSignal;
  const acledFragilityMultiplier = acledSignal?.fragilityMultiplier ?? 1;
  const acledOverlayActive = acledFragilityMultiplier > 1;

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

  // Air campaigns are calibrated from event-level displacement shares (Iran 2026:
  // ~3.2M of ~89M people), not from long-run UNHCR conflict displacement ratios.
  const displacementShare =
    scenario === 'air_campaign'
      ? def.displacementMultiplier
      : totalDisplacementRatio * def.displacementMultiplier;

  const baseDisplacedPoint = populationAtRisk * displacementShare;
  const displacedPoint = Math.round(baseDisplacedPoint * acledFragilityMultiplier);
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

  // ── Direct casualty costs ──────────────────────────────────────────────────
  // Monetizes killed and injured using the WHO human-capital VSL proxy.
  // VSL ≈ target GDP per capita × 100 (World Bank / WHO methodology).
  // Injury cost ≈ VSL × 0.15 (long-term disability, trauma care, lost productivity).
  const gdpPerCapita = (target.gdp != null && target.population != null && target.population > 0)
    ? target.gdp / target.population
    : 5_000; // fallback $5K
  const vsl = Math.max(gdpPerCapita * 100, 200_000); // floor at $200K

  const durationDays = durationYears * 365;
  const populationMillions = populationAtRisk / 1_000_000;
  const casualtyRates = DAILY_CASUALTIES_PER_MILLION[scenario] ?? { killed: 1.0, injured: 7.0 };

  const killedPoint   = Math.round(casualtyRates.killed  * populationMillions * durationDays);
  const injuredPoint  = Math.round(casualtyRates.injured * populationMillions * durationDays);
  const killedMin     = Math.round(killedPoint  * 0.4);
  const killedMax     = Math.round(killedPoint  * 2.5);
  const injuredMin    = Math.round(injuredPoint * 0.4);
  const injuredMax    = Math.round(injuredPoint * 2.5);

  const casualtyCostKilled  = killedPoint  * vsl;
  const casualtyCostInjured = injuredPoint * vsl * 0.15;
  const casualtyCostPoint   = casualtyCostKilled + casualtyCostInjured;
  const casualtyCostMin     = killedMin  * vsl + injuredMin  * vsl * 0.15;
  const casualtyCostMax     = killedMax  * vsl + injuredMax  * vsl * 0.15;

  const items: LineItem[] = [
    {
      label: 'Internally displaced persons (IDP) support',
      amount: idpCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'idp-support',
          description: `${formatNum(idpCount)} IDPs (${(idpFraction * 100).toFixed(0)}% of displaced, UNHCR ${ratioSource} ratio${populationAtRisk < population ? `; displacement scaled to ${formatNum(populationAtRisk)} population-at-risk in conflict zone` : ''}${acledOverlayActive ? `; ACLED overlay +${(acledFragilityMultiplier * 100 - 100).toFixed(1)}% from ${acledSignal?.politicalViolenceEvents ?? 0} recent political-violence events and ${Math.round(acledSignal?.reportedFatalities ?? 0).toLocaleString()} reported fatalities` : ''}). Shelter, food, WASH, protection: $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(idpCount)} × $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(idpCost)}`,
          value: idpCost,
          unit: 'USD',
          sources: acledOverlayActive ? [SOURCES.unhcr, SOURCES.worldbank_pop, SOURCES.acled] : [SOURCES.unhcr, SOURCES.worldbank_pop],
        },
      ],
      sources: acledOverlayActive ? [SOURCES.unhcr, SOURCES.worldbank_pop, SOURCES.acled] : [SOURCES.unhcr, SOURCES.worldbank_pop],
    },
    {
      label: 'Cross-border refugee resettlement',
      amount: refugeeCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'refugee-resettlement',
          description: `${formatNum(refugeeCount)} cross-border refugees (${(refugeeFraction * 100).toFixed(0)}% of displaced, UNHCR ${ratioSource} ratio${populationAtRisk < population ? `; displacement scaled to ${formatNum(populationAtRisk)} population-at-risk in conflict zone` : ''}${acledOverlayActive ? `; ACLED overlay +${(acledFragilityMultiplier * 100 - 100).toFixed(1)}%` : ''}). Host-country resettlement, legal status, integration: $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(refugeeCount)} × $${UNHCR_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(refugeeCost)}`,
          value: refugeeCost,
          unit: 'USD',
          sources: acledOverlayActive ? [SOURCES.unhcr, SOURCES.acled] : [SOURCES.unhcr],
        },
      ],
      sources: acledOverlayActive ? [SOURCES.unhcr, SOURCES.acled] : [SOURCES.unhcr],
    },
    {
      label: 'Emergency healthcare & trauma response',
      amount: healthcareCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'emergency-healthcare',
          description: `Emergency health costs for all ${formatNum(displacedPoint)} displaced persons${populationAtRisk < population ? ` (from ${formatNum(populationAtRisk)} population-at-risk in conflict zone)` : ''}${acledOverlayActive ? ` with ACLED fragility overlay of ${(acledFragilityMultiplier * 100 - 100).toFixed(1)}%` : ''}: $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()}/person/yr (WHO Emergency Health Financing). Covers trauma surgery, disease surveillance, mental health, and primary care over ${displacementDuration.toFixed(1)}yr`,
          formula: `${formatNum(displacedPoint)} × $${WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD.toLocaleString()} × ${displacementDuration.toFixed(1)}yr = ${formatUsdH(healthcareCost)}`,
          value: healthcareCost,
          unit: 'USD',
          sources: acledOverlayActive ? [SOURCES.who, SOURCES.acled] : [SOURCES.who],
        },
      ],
      sources: acledOverlayActive ? [SOURCES.who, SOURCES.acled] : [SOURCES.who],
    },
    {
      label: 'Direct casualties (killed & injured)',
      amount: casualtyCostPoint,
      isEstimate: true,
      confidence: 'low',
      sources: [SOURCES.who, SOURCES.csis_iran],
      assumptions: [
        {
          id: 'casualty_vsl',
          description: `${formatNum(killedPoint)} killed + ${formatNum(injuredPoint)} injured estimated over ${durationDays.toFixed(0)} days. VSL = GDP/capita ($${gdpPerCapita.toFixed(0)}) × 100 = $${formatNum(vsl)} per statistical life (WHO human-capital method). Injury cost = VSL × 15%. Rates calibrated from: Iran 2026 air campaign (1.0 killed/M/day), Iraq 2003 invasion (5.0/M/day for conventional).`,
          formula: `killed × VSL + injured × VSL × 0.15`,
          value: casualtyCostPoint,
          unit: 'USD',
          sources: [SOURCES.who, SOURCES.csis_iran],
        },
      ],
    },
  ];

  const humanToll: HumanToll = {
    displacedPersonsPoint: displacedPoint,
    displacedPersonsMin: displacedMin,
    displacedPersonsMax: displacedMax,
    killedPoint,
    killedMin,
    killedMax,
    injuredPoint,
    source: SOURCES.unhcr,
    note: `Displacement estimates based on UNHCR historical ratios. Direct casualties monetized via WHO human-capital VSL method (GDP/capita × 100). Casualty rates calibrated to Iran 2026 air campaign (CSIS) and Iraq 2003 invasion data.`,
  };

  const totalAmount    = displacementCost  + casualtyCostPoint;
  const totalAmountMin = (displacedMin * costPerPersonPerYear * displacementDuration) + casualtyCostMin;
  const totalAmountMax = (displacedMax * costPerPersonPerYear * displacementDuration) + casualtyCostMax;

  return {
    category: {
      label: 'Humanitarian',
      amount: totalAmount,
      amountMin: totalAmountMin,
      amountMax: totalAmountMax,
      color: '#b45309',
      items,
      methodology: `Humanitarian costs include IDP support, cross-border refugee resettlement, emergency healthcare, and direct casualty costs. ` +
        `${formatNum(displacedPoint)} displaced persons (${(displacementShare * 100).toFixed(1)}% of ${populationAtRisk < population ? `${formatNum(populationAtRisk)} pop-at-risk` : `population`}` +
        `${acledOverlayActive ? ` × ${acledFragilityMultiplier.toFixed(3)} ACLED overlay` : ''}). ` +
        `Direct casualties: ${formatNum(killedPoint)} killed, ${formatNum(injuredPoint)} injured over ${durationDays.toFixed(0)} days at ${casualtyRates.killed}/M/day killed rate. ` +
        `VSL = $${formatNum(vsl)} (GDP/capita × 100, WHO method). ` +
        `NOTE: Casualty count shown in HumanToll; casualty cost is now included in the Humanitarian total.`,
      sources: acledOverlayActive
        ? [SOURCES.unhcr, SOURCES.who, SOURCES.worldbank_pop, SOURCES.acled, SOURCES.csis_iran]
        : [SOURCES.unhcr, SOURCES.who, SOURCES.worldbank_pop, SOURCES.csis_iran],
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
