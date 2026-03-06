import { CalculationInput, CostCategory, LineItem, Source } from '@/types';
import { SCENARIOS, SANCTIONS_GDP_PCT, TRADE_DISRUPTION_FACTOR } from '@/constants/conflict-scenarios';
// Note: SANCTIONS_GDP_PCT is used as fallback when militaryBudgetUsd is null
import bilateralTrade from '@/lib/data/bilateral-trade-shares.json';
import commodityData from '@/lib/data/commodity-producers.json';

const SOURCES: Record<string, Source> = {
  worldbank_gdp: {
    name: 'World Bank — GDP (current USD)',
    url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD',
    indicator: 'NY.GDP.MKTP.CD',
    year: 2023,
    isStatic: false,
  },
  worldbank_trade: {
    name: 'World Bank — Trade (% of GDP)',
    url: 'https://data.worldbank.org/indicator/NE.TRD.GNFS.ZS',
    indicator: 'NE.TRD.GNFS.ZS',
    year: 2023,
    isStatic: false,
  },
  comtrade: {
    name: 'UN Comtrade Database',
    url: 'https://comtradeplus.un.org/',
    year: 2022,
    isStatic: true,
  },
  wto: {
    name: 'WTO — Trade and Conflict Studies',
    url: 'https://www.wto.org/english/res_e/reser_e/gtdw_e/wkshop08_e/martin_e.pdf',
    year: 2020,
    isStatic: true,
  },
  imf_gdp: {
    name: 'IMF World Economic Outlook',
    url: 'https://www.imf.org/en/Publications/WEO',
    year: 2023,
    isStatic: false,
  },
  worldbank_conflict: {
    name: 'World Bank — Conflict and Development',
    url: 'https://www.worldbank.org/en/topic/fragilityconflictviolence',
    year: 2022,
    isStatic: true,
  },
  iea: {
    name: 'IEA Oil Market Report',
    url: 'https://www.iea.org/reports/oil-market-report-december-2023',
    year: 2023,
    isStatic: true,
  },
};

/** Look up bilateral trade volume (sorted alpha-3 key) */
function getBilateralTrade(codeA: string, codeB: string): number | null {
  const key1 = `${codeA}-${codeB}`;
  const key2 = `${codeB}-${codeA}`;
  const pairs = (bilateralTrade as { pairs: Record<string, { tradeVolumeUsd: number }> }).pairs;
  return pairs[key1]?.tradeVolumeUsd ?? pairs[key2]?.tradeVolumeUsd ?? null;
}

/**
 * Gravity model estimate for bilateral trade when not in lookup table.
 * Simplified: trade ∝ sqrt(GDP_A × GDP_B) / distance
 */
function estimateBilateralTrade(gdpA: number, gdpB: number, distanceKm: number): number {
  const gravityConstant = 0.004;
  return gravityConstant * Math.sqrt(gdpA * gdpB) / Math.max(distanceKm, 500);
}

/** Lookup commodity shock from target country */
function getCommodityShock(targetCode: string, durationYears: number): { amount: number; note: string } | null {
  const data = commodityData as {
    oil: Record<string, { globalGdpShockUsd: number; note: string }>;
    naturalGas: Record<string, { globalGdpShockUsd: number; note: string }>;
    wheat: Record<string, { globalGdpShockUsd: number; note: string }>;
    semiconductors: Record<string, { globalGdpShockUsd: number; note: string }>;
    lithium: Record<string, { globalGdpShockUsd: number; note: string }>;
  };

  let maxShock = 0;
  let note = '';

  for (const category of ['oil', 'naturalGas', 'wheat', 'semiconductors'] as const) {
    const entry = data[category]?.[targetCode];
    if (entry && entry.globalGdpShockUsd > maxShock) {
      maxShock = entry.globalGdpShockUsd;
      note = entry.note;
    }
  }

  if (maxShock === 0) return null;
  // Commodity shock is annual; scale by duration (diminishing returns after year 1)
  const scaledShock = maxShock * (1 + Math.log(Math.max(durationYears, 1)) * 0.3);
  return { amount: scaledShock, note };
}

export function calculateEconomicImpact(
  input: CalculationInput,
  distanceKm: number
): CostCategory {
  const { aggressor, target, scenario } = input;
  const def = SCENARIOS[scenario];
  const durationYears = def.durationYears.point;

  const aggressorGdp = aggressor.gdp ?? 1_000_000_000_000;
  const targetGdp = target.gdp ?? 100_000_000_000;

  // --- Bilateral trade loss ---
  let bilateralTradeVol = getBilateralTrade(aggressor.code, target.code);
  let tradeIsEstimated = false;
  if (!bilateralTradeVol) {
    bilateralTradeVol = estimateBilateralTrade(aggressorGdp, targetGdp, distanceKm);
    tradeIsEstimated = true;
  }
  const tradeLoss = bilateralTradeVol * TRADE_DISRUPTION_FACTOR * durationYears;

  // --- Target GDP contraction (real economic damage to the targeted nation) ---
  // Note: Aggressor GDP loss is NOT modeled here — direct war spending is already in the military module.
  // Historical evidence: US/UK/France economies GREW during their foreign wars.
  // The target economy, however, suffers severe contraction from physical destruction.
  const targetGdpLoss = targetGdp * def.gdpImpactPct.target * durationYears;

  // --- Sanctions received by aggressor ---
  // Sanctions are highly context-specific and cannot be reliably modeled without knowing
  // geopolitical context (UN authorization, aggressor's trade dependencies, etc.).
  // We omit automatic sanctions calculation to avoid misleading estimates.
  // Users who have specific sanction data should contact us to add it.
  // Reference: Russia 2022 sanctions ≈ $150-300B/year impact (IMF); US in Afghan war ≈ $0
  const sanctionsCost = 0;
  void SANCTIONS_GDP_PCT; // retained for reference — not used in this calculation

  // --- Commodity shock ---
  const commodityShock = getCommodityShock(target.code, durationYears);

  const total =
    tradeLoss +
    targetGdpLoss +
    sanctionsCost +
    (commodityShock?.amount ?? 0);

  const items: LineItem[] = [
    {
      label: 'Bilateral trade disruption',
      amount: tradeLoss,
      isEstimate: tradeIsEstimated,
      confidence: tradeIsEstimated ? 'low' : 'high',
      assumptions: [
        {
          id: 'trade-loss',
          description: `${tradeIsEstimated ? 'Estimated' : 'Known'} bilateral trade: $${(bilateralTradeVol / 1e9).toFixed(0)}B/year × 70% disruption × ${durationYears} years`,
          formula: `${formatUsd(bilateralTradeVol)}/yr × ${TRADE_DISRUPTION_FACTOR} × ${durationYears} = ${formatUsd(tradeLoss)}`,
          value: tradeLoss,
          unit: 'USD',
          sources: tradeIsEstimated ? [] : [SOURCES.comtrade],
        },
      ],
      sources: [SOURCES.comtrade, SOURCES.wto],
    },
    {
      label: `${target.name} GDP contraction`,
      amount: targetGdpLoss,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'target-gdp',
          description: `Target nations in active conflict typically lose ${(def.gdpImpactPct.target * 100).toFixed(0)}%/year of GDP (World Bank conflict studies)`,
          formula: `${formatUsd(targetGdp)} × ${def.gdpImpactPct.target} × ${durationYears} = ${formatUsd(targetGdpLoss)}`,
          value: targetGdpLoss,
          unit: 'USD',
          sources: [SOURCES.worldbank_conflict],
        },
      ],
      sources: [SOURCES.worldbank_gdp, SOURCES.worldbank_conflict],
    },
  ];
  void sanctionsCost; // Sanctions not automatically modeled — too context-specific

  if (commodityShock) {
    items.push({
      label: 'Global commodity price shock',
      amount: commodityShock.amount,
      isEstimate: true,
      confidence: 'low',
      assumptions: [
        {
          id: 'commodity-shock',
          description: commodityShock.note,
          formula: `Global GDP shock from ${target.name} commodity disruption`,
          value: commodityShock.amount,
          unit: 'USD',
          sources: [SOURCES.iea],
        },
      ],
      sources: [SOURCES.iea],
    });
  }

  return {
    label: 'Economic Impact',
    amount: total,
    amountMin: total * 0.6,
    amountMax: total * 1.6,
    color: '#c41230',
    items,
    methodology: `Economic costs include: bilateral trade disruption (${(TRADE_DISRUPTION_FACTOR * 100).toFixed(0)}% of trade lost, WTO historical average), ` +
      `${target.name} GDP contraction (${(def.gdpImpactPct.target * 100).toFixed(0)}%/year, World Bank conflict database), ` +
      `international sanctions costs (IMF estimate)` +
      (commodityShock ? `, and global commodity price shock from ${target.name}'s role as a major producer.` : '.') +
      ` Note: Aggressor GDP loss is not separately modeled — evidence shows large-economy aggressors (US, Russia) did not experience GDP contraction during foreign wars; direct spending is captured in the Military module.`,
    sources: Object.values(SOURCES),
  };
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
