import { CalculationInput, CommodityPrices, CostCategory, LineItem, Source } from '@/types';
import { SCENARIOS, TRADE_DISRUPTION_FACTOR } from '@/constants/conflict-scenarios';
import { bilateralTradeData, canonicalPairKey, commodityProducersData } from '@/lib/data/validated';

// ─── Baseline commodity prices (2023 annual averages) ─────────────────────────
// globalGdpShockUsd in commodity-producers.json was calibrated at these levels.
// FRED live prices are used to scale shocks proportionally.
const PRICE_BASELINES = {
  oil: 80,        // $/barrel  (WTI 2023 avg ~$77–82)
  naturalGas: 2.5, // $/MMBtu  (Henry Hub 2023 avg ~$2.5)
  wheat: 225,     // $/metric ton (CME CBOT wheat 2023 avg ~$220–230)
};

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
    year: bilateralTradeData.metadata.year,
    isStatic: true,
  },
  comtrade_live: {
    name: 'UN Comtrade API — Bilateral Trade Data',
    url: 'https://comtradeapi.un.org/tools/v1/getBilateralData',
    year: new Date().getFullYear(),
    isStatic: false,
  },
  wto: {
    name: 'WTO — Trade and Conflict Studies',
    url: 'https://www.wto.org/english/res_e/reser_e/gtdw_e/wkshop08_e/martin_e.pdf',
    year: 2020,
    isStatic: true,
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
  fred: {
    name: 'FRED — Federal Reserve Bank of St. Louis (live commodity prices)',
    url: 'https://fred.stlouisfed.org',
    year: new Date().getFullYear(),
    isStatic: false,
  },
  opensanctions: {
    name: 'OpenSanctions — International Sanctions Database',
    url: 'https://www.opensanctions.org',
    year: new Date().getFullYear(),
    isStatic: false,
  },
  neuenkirch2015: {
    name: 'Neuenkirch & Neumeier (2015) — Impact of UN and US sanctions on GDP growth',
    url: 'https://doi.org/10.1016/j.jdeveco.2015.04.005',
    year: 2015,
    isStatic: true,
  },
  imf_capital_flight: {
    name: 'IMF Working Paper WP/16/47 — Capital Flows in Conflict-Affected Countries',
    url: 'https://www.imf.org/en/Publications/WP/Issues/2016/12/31/Capital-Flows-in-Conflict-Affected-Countries-43785',
    year: 2016,
    isStatic: true,
  },
  acled: {
    name: 'ACLED API — Political Violence Events',
    url: 'https://acleddata.com/api-documentation/acled-endpoint/',
    year: new Date().getFullYear(),
    isStatic: false,
  },
};

/** Look up bilateral trade volume (sorted alpha-3 key) */
function getBilateralTrade(codeA: string, codeB: string): number | null {
  const key = canonicalPairKey(codeA, codeB);
  return bilateralTradeData.pairs[key]?.tradeVolumeUsd ?? null;
}

/**
 * Gravity model estimate for bilateral trade when not in lookup table.
 * Simplified: trade ∝ sqrt(GDP_A × GDP_B) / distance
 */
function estimateBilateralTrade(gdpA: number, gdpB: number, distanceKm: number): number {
  const gravityConstant = 0.004;
  return gravityConstant * Math.sqrt(gdpA * gdpB) / Math.max(distanceKm, 500);
}

/**
 * Lookup commodity shock from target country's role as a global commodity producer.
 *
 * When live FRED prices are available, the shock is scaled proportionally to
 * (currentPrice / 2023-baseline) for oil, gas, and wheat. Semiconductors and
 * lithium are structural shocks (supply-chain, not price-sensitive) and are not scaled.
 */
function getCommodityShock(
  targetCode: string,
  durationYears: number,
  commodityPrices?: CommodityPrices
): { amount: number; note: string; priceScalar: number | null; category: string } | null {
  const data = commodityProducersData;

  let totalShock = 0;
  const categories: string[] = [];
  let dominantCategory = '';
  let dominantShock = 0;
  let combinedNote = '';
  let dominantPriceScalar: number | null = null;

  for (const category of ['oil', 'naturalGas', 'wheat', 'semiconductors', 'lithium'] as const) {
    const entry = data[category]?.[targetCode];
    const shock = entry?.globalGdpShockUsd ?? 0;
    if (!entry || shock === 0) continue;

    // Per-category price scalar
    let priceScalar = 1;
    if (commodityPrices) {
      if (category === 'oil' && commodityPrices.oilUsdPerBarrel !== null) {
        priceScalar = commodityPrices.oilUsdPerBarrel / PRICE_BASELINES.oil;
      } else if (category === 'naturalGas' && commodityPrices.gasUsdPerMmbtu !== null) {
        priceScalar = commodityPrices.gasUsdPerMmbtu / PRICE_BASELINES.naturalGas;
      } else if (category === 'wheat' && commodityPrices.wheatUsdPerTon !== null) {
        priceScalar = commodityPrices.wheatUsdPerTon / PRICE_BASELINES.wheat;
      }
      // semiconductors / lithium: structural supply-chain shock — not price-scaled
    }

    // Duration scaling with diminishing returns (sqrt); price scalar applied per category
    const scaled = shock * priceScalar * Math.sqrt(Math.max(durationYears, 1));
    totalShock += scaled;
    categories.push(category);
    if (shock > dominantShock) {
      dominantShock = shock;
      dominantCategory = category;
      combinedNote = entry.note;
      dominantPriceScalar = priceScalar;
    }
  }

  if (totalShock === 0) return null;

  return {
    amount: totalShock,
    note: combinedNote + (categories.length > 1 ? ` (+ ${categories.filter(c => c !== dominantCategory).join(', ')})` : ''),
    priceScalar: categories.length === 1 ? dominantPriceScalar : null,
    category: categories.length > 1 ? categories.join(' + ') : dominantCategory,
  };
}

export function calculateEconomicImpact(
  input: CalculationInput,
  distanceKm: number
): CostCategory {
  const { aggressor, target, scenario } = input;
  const commodityPrices = input.liveData?.commodityPrices;
  const aggressorSanctions = input.liveData?.aggressorSanctions;
  const liveBilateralTrade = input.liveData?.bilateralTrade;
  const acledSignal = input.liveData?.acledSignal;

  const def = SCENARIOS[scenario];
  const durationYears = def.durationYears.point;

  const aggressorGdp = aggressor.gdp ?? 1_000_000_000_000;
  const targetGdp = target.gdp ?? 100_000_000_000;
  const acledFragilityMultiplier = acledSignal?.fragilityMultiplier ?? 1;
  const acledOverlayActive = acledFragilityMultiplier > 1;

  // --- Bilateral trade loss ---
  let bilateralTradeVol = liveBilateralTrade?.tradeVolumeUsd ?? getBilateralTrade(aggressor.code, target.code);
  let tradeIsEstimated = false;
  const tradeSource = liveBilateralTrade
    ? { ...SOURCES.comtrade_live, year: liveBilateralTrade.year }
    : SOURCES.comtrade;
  if (!bilateralTradeVol) {
    bilateralTradeVol = estimateBilateralTrade(aggressorGdp, targetGdp, distanceKm);
    tradeIsEstimated = true;
  }
  // Overlap discount: bilateral trade disruption is partially captured inside GDP contraction.
  // We apply 50% to avoid double-counting the portion already reflected in GDP loss.
  const TRADE_GDP_OVERLAP_DISCOUNT = 0.5;
  const tradeLoss = bilateralTradeVol * TRADE_DISRUPTION_FACTOR * durationYears * TRADE_GDP_OVERLAP_DISCOUNT;

  // --- Target GDP contraction ---
  // Aggressor GDP loss NOT modeled here — historical evidence shows large-economy aggressors
  // (US/UK/France) grew during foreign wars. The military module captures direct spending.
  const baseTargetGdpLoss = targetGdp * (1 - Math.pow(1 - def.gdpImpactPct.target, durationYears));
  const targetGdpLoss = baseTargetGdpLoss * acledFragilityMultiplier;

  // --- Sanctions cost (aggressor) ---
  // Applied only for countries with well-documented sanctions regimes (see sanctions-regimes.json).
  // For unlisted aggressors we apply 0 rather than speculate on geopolitical likelihood.
  // Source: Neuenkirch & Neumeier (2015), IMF WEO, OpenSanctions database.
  let sanctionsCost = 0;
  if (aggressorSanctions) {
    sanctionsCost = aggressorGdp * aggressorSanctions.additionalWarSanctionsPct * durationYears;
  }

  // --- Commodity shock ---
  const commodityShock = getCommodityShock(target.code, durationYears, commodityPrices);
  const useLivePrices = commodityPrices !== undefined &&
    (commodityPrices.oilUsdPerBarrel !== null ||
      commodityPrices.gasUsdPerMmbtu !== null ||
      commodityPrices.wheatUsdPerTon !== null);

  // --- Capital flight (target country) ---
  // Sudden-stop capital flight is a robust cross-conflict finding (IMF WP/16/47).
  // Capped at 2 years: the acute phase typically resolves or hardens within that window.
  const CAPITAL_FLIGHT_PCT: Record<string, number> = {
    precision_strike: 0.03, // ~3%/yr — short duration limits flight; some investor panic
    air_campaign:     0.07, // ~7%/yr — sustained bombing drives significant capital exit (Iran 2026: banking system frozen, oil exports halted)
    skirmish:         0.02, // ~2%/yr — investors reduce exposure during limited hostilities
    conventional:     0.08, // ~8%/yr — portfolio/FDI reversal (Kharas et al.; WB conflict database)
    occupation:       0.06, // ~6%/yr — partial stabilization as occupying power establishes control
  };
  const capitalFlightPct = CAPITAL_FLIGHT_PCT[scenario] ?? 0.04;
  const capitalFlightYears = Math.min(durationYears, 2);
  const baseCapitalFlightCost = targetGdp * capitalFlightPct * capitalFlightYears;
  const capitalFlightCost = baseCapitalFlightCost * (1 + ((acledFragilityMultiplier - 1) * 0.6));

  const total =
    tradeLoss +
    targetGdpLoss +
    sanctionsCost +
    capitalFlightCost +
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
          description: `${tradeIsEstimated ? 'Estimated' : liveBilateralTrade ? `Live UN Comtrade ${liveBilateralTrade.year}` : 'Known'} bilateral trade: $${(bilateralTradeVol / 1e9).toFixed(0)}B/year × 70% disruption × ${durationYears} years × 50% overlap discount (trade loss partially captured in GDP contraction)`,
          formula: `${formatUsd(bilateralTradeVol)}/yr × ${TRADE_DISRUPTION_FACTOR} × ${durationYears} × ${TRADE_GDP_OVERLAP_DISCOUNT} = ${formatUsd(tradeLoss)}`,
          value: tradeLoss,
          unit: 'USD',
          sources: tradeIsEstimated ? [] : [tradeSource],
        },
      ],
      sources: tradeIsEstimated ? [SOURCES.wto] : [tradeSource, SOURCES.wto],
    },
    {
      label: `${target.name} GDP contraction`,
      amount: targetGdpLoss,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'target-gdp',
          description: `Target nations in active conflict lose ~${(def.gdpImpactPct.target * 100).toFixed(0)}%/year of GDP (compounding — World Bank conflict studies).` +
            (acledOverlayActive
              ? ` Live ACLED overlay: ${acledSignal?.politicalViolenceEvents ?? 0} political-violence events and ${Math.round(acledSignal?.reportedFatalities ?? 0).toLocaleString()} reported fatalities in the last ${acledSignal?.lookbackDays ?? 365} days increase vulnerability by ${(acledFragilityMultiplier * 100 - 100).toFixed(1)}%.`
              : ''),
          formula: acledOverlayActive
            ? `${formatUsd(baseTargetGdpLoss)} × ${acledFragilityMultiplier.toFixed(3)} = ${formatUsd(targetGdpLoss)}`
            : `${formatUsd(targetGdp)} × (1 − (1 − ${def.gdpImpactPct.target})^${durationYears}) = ${formatUsd(targetGdpLoss)}`,
          value: targetGdpLoss,
          unit: 'USD',
          sources: acledOverlayActive ? [SOURCES.worldbank_conflict, SOURCES.acled] : [SOURCES.worldbank_conflict],
        },
      ],
      sources: acledOverlayActive
        ? [SOURCES.worldbank_gdp, SOURCES.worldbank_conflict, SOURCES.acled]
        : [SOURCES.worldbank_gdp, SOURCES.worldbank_conflict],
    },
  ];

  // Capital flight line item
  items.push({
    label: `${target.name} capital flight`,
    amount: capitalFlightCost,
    isEstimate: true,
    confidence: 'medium',
    assumptions: [
        {
          id: 'capital-flight',
          description: `Capital flight: ${(capitalFlightPct * 100).toFixed(0)}%/yr of target GDP for up to 2 years (IMF WP/16/47: conflict triggers portfolio/FDI reversal — capped at 2yr as acute phase typically resolves or stabilises)` +
            (acledOverlayActive ? `, then scaled by ${(1 + ((acledFragilityMultiplier - 1) * 0.6)).toFixed(3)} for recent ACLED-recorded instability.` : ''),
          formula: acledOverlayActive
            ? `${formatUsd(baseCapitalFlightCost)} × ${(1 + ((acledFragilityMultiplier - 1) * 0.6)).toFixed(3)} = ${formatUsd(capitalFlightCost)}`
            : `${formatUsd(targetGdp)} × ${capitalFlightPct} × ${capitalFlightYears}yr = ${formatUsd(capitalFlightCost)}`,
          value: capitalFlightCost,
          unit: 'USD',
          sources: acledOverlayActive
            ? [SOURCES.imf_capital_flight, SOURCES.worldbank_conflict, SOURCES.acled]
            : [SOURCES.imf_capital_flight, SOURCES.worldbank_conflict],
        },
      ],
    sources: acledOverlayActive
      ? [SOURCES.imf_capital_flight, SOURCES.worldbank_conflict, SOURCES.acled]
      : [SOURCES.imf_capital_flight, SOURCES.worldbank_conflict],
  });

  // Sanctions line item — only included when we have empirical backing
  if (sanctionsCost > 0 && aggressorSanctions) {
    items.push({
      label: `${aggressor.name} sanctions costs`,
      amount: sanctionsCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'sanctions',
          description: aggressorSanctions.note,
          formula: `${formatUsd(aggressorGdp)} GDP × ${(aggressorSanctions.additionalWarSanctionsPct * 100).toFixed(1)}%/yr × ${durationYears}yr = ${formatUsd(sanctionsCost)}`,
          value: sanctionsCost,
          unit: 'USD',
          sources: [SOURCES.neuenkirch2015, SOURCES.opensanctions],
        },
      ],
      sources: [SOURCES.neuenkirch2015, SOURCES.opensanctions],
    });
  }

  if (commodityShock) {
    const priceNote = useLivePrices && commodityShock.priceScalar !== null && commodityShock.priceScalar !== 1
      ? ` (price-scaled ${commodityShock.priceScalar > 1 ? '+' : ''}${((commodityShock.priceScalar - 1) * 100).toFixed(0)}% vs 2023 baseline via live FRED data)`
      : '';
    const commoditySources = useLivePrices
      ? [SOURCES.iea, SOURCES.fred]
      : [SOURCES.iea];

    items.push({
      label: 'Global commodity price shock',
      amount: commodityShock.amount,
      isEstimate: true,
      confidence: 'low',
      assumptions: [
        {
          id: 'commodity-shock',
          description: commodityShock.note + priceNote,
          formula: `Global GDP shock from ${target.name} ${commodityShock.category} disruption${priceNote}`,
          value: commodityShock.amount,
          unit: 'USD',
          sources: commoditySources,
        },
      ],
      sources: commoditySources,
    });
  }

  const baseSources = [tradeIsEstimated ? SOURCES.wto : tradeSource, SOURCES.wto, SOURCES.worldbank_gdp, SOURCES.worldbank_conflict, SOURCES.iea, SOURCES.imf_capital_flight];
  if (sanctionsCost > 0) baseSources.push(SOURCES.neuenkirch2015, SOURCES.opensanctions);
  if (useLivePrices) baseSources.push(SOURCES.fred);
  if (acledOverlayActive) baseSources.push(SOURCES.acled);

  return {
    label: 'Economic Impact',
    amount: total,
    amountMin: total * 0.6,
    amountMax: total * 1.6,
    color: '#c41230',
    items,
    methodology:
      `Economic costs include: bilateral trade disruption (${(TRADE_DISRUPTION_FACTOR * 100).toFixed(0)}% of trade lost × 50% overlap discount, WTO historical average), ` +
      `${target.name} GDP contraction (${(def.gdpImpactPct.target * 100).toFixed(0)}%/year compounding over ${durationYears}yr = ${((1 - Math.pow(1 - def.gdpImpactPct.target, durationYears)) * 100).toFixed(1)}% cumulative, World Bank conflict database${acledOverlayActive ? `, scaled +${(acledFragilityMultiplier * 100 - 100).toFixed(1)}% by recent ACLED political-violence intensity` : ''}), ` +
      `${target.name} capital flight (${(capitalFlightPct * 100).toFixed(0)}%/yr for up to 2yr, IMF WP/16/47${acledOverlayActive ? `, with recent ACLED instability overlay` : ''})` +
      (sanctionsCost > 0 && aggressorSanctions
        ? `, ${aggressor.name} sanctions costs (${(aggressorSanctions.additionalWarSanctionsPct * 100).toFixed(1)}%/yr GDP impact, ${aggressorSanctions.regime})`
        : '') +
      (commodityShock ? `, and global commodity price shock from ${target.name}'s role as a major ${commodityShock.category} producer` : '') +
      (useLivePrices ? ` — commodity shocks scaled to live market prices (FRED).` : '.') +
      ` Note: Aggressor GDP loss is not separately modeled — evidence shows large-economy aggressors did not experience GDP contraction during foreign wars; direct spending is captured in the Military module.`,
    sources: baseSources,
  };
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
