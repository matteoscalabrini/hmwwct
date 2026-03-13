import { CalculationInput, RevenueItem, WarRevenueResult } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import { commodityProducersData } from '@/lib/data/validated';

// ─── World Market Annual Values (2023 estimates) ──────────────────────────────
// Sources: IEA Oil Market Report 2023, IEA Gas Market Report Q4 2023,
//          FAO STAT 2023, WSTS Semiconductor Market 2023,
//          Benchmark Mineral Intelligence Lithium 2023
const WORLD_MARKET_USD: Record<string, number> = {
  oil:            2_920_000_000_000, // ~100M bpd × 365 × $80/bbl
  naturalGas:     840_000_000_000,   // IEA global gas trade value
  wheat:          50_000_000_000,    // FAO global wheat export value
  semiconductors: 550_000_000_000,   // WSTS 2023 total market
  lithium:        50_000_000_000,    // 2023 lithium carbonate equivalent market
};

// What fraction of the target's annual resource revenue the aggressor can realistically capture.
// Assumes aggressor wins. Reduced by: extraction costs, resistance, sabotage,
// international sanctions, infrastructure damage.
// Historical precedent: US captured 0% of Iraq oil revenue; Russia captures ~40-50%
// of Ukrainian grain in occupied oblasts (USDA/FAO estimates).
const CAPTURE_RATE: Record<string, number> = {
  skirmish:     0.00, // No sustained territorial control
  conventional: 0.15, // Partial/contested control; active conflict disrupts operations
  occupation:   0.50, // Sustained control, but sabotage and extraction costs halve yield
};

// Monetary gold reserves are a one-time stock (central bank asset), not an annual flow.
// We model only a partial seizure probability by scenario.
const GOLD_RESERVE_SEIZURE_RATE: Record<string, number> = {
  skirmish: 0.00,
  conventional: 0.08,
  occupation: 0.25,
};

// Only aggressors with large domestic defense industries see a stimulus effect.
// Proxy: military budget > $30B (implies domestic production base).
// Source: US BEA shows defense sector multiplier ~1.4x; UK DASA; French DGA reports.
const DEFENSE_STIMULUS_THRESHOLD_USD = 30_000_000_000;
const DEFENSE_GDP_MULTIPLIER = 0.30; // ~30% of additional wartime spend flows as domestic GDP

export function calculateRevenue(
  input: CalculationInput,
  totalCostUsd: number,
): WarRevenueResult {
  const { aggressor, target, scenario } = input;
  const def = SCENARIOS[scenario];
  const captureRate = CAPTURE_RATE[scenario];
  const durationYears = def.durationYears.point;

  const items: RevenueItem[] = [];
  const oil = commodityProducersData.oil[target.code];
  const gas = commodityProducersData.naturalGas[target.code];
  const wheat = commodityProducersData.wheat[target.code];
  const chips = commodityProducersData.semiconductors[target.code];
  const lithium = commodityProducersData.lithium[target.code];

  if (oil && captureRate > 0) {
    const annualUsd = (oil.pctWorldProduction / 100) * WORLD_MARKET_USD.oil * captureRate;
    items.push({
      label: 'OIL FIELD EXTRACTION',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'medium',
      note: `${oil.pctWorldProduction}% world production · ${(captureRate * 100).toFixed(0)}% capture rate · IEA 2023`,
    });
  }

  if (gas && captureRate > 0) {
    const annualUsd = (gas.pctWorldProduction / 100) * WORLD_MARKET_USD.naturalGas * captureRate;
    items.push({
      label: 'NATURAL GAS EXTRACTION',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'medium',
      note: `${gas.pctWorldProduction}% world production · ${(captureRate * 100).toFixed(0)}% capture rate · IEA 2023`,
    });
  }

  if (wheat && captureRate > 0) {
    const annualUsd = (wheat.pctWorldExports / 100) * WORLD_MARKET_USD.wheat * captureRate;
    items.push({
      label: 'AGRICULTURAL EXTRACTION (WHEAT)',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'low',
      note: `${wheat.pctWorldExports}% world exports · ${(captureRate * 100).toFixed(0)}% capture rate · FAO 2023`,
    });
  }

  if (chips && captureRate > 0) {
    const annualUsd = (chips.pctWorldProduction / 100) * WORLD_MARKET_USD.semiconductors * captureRate;
    items.push({
      label: 'SEMICONDUCTOR FACILITY CAPTURE',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'low',
      note: `${chips.pctWorldProduction}% world production · highly disrupted by conflict · WSTS 2023`,
    });
  }

  if (lithium && captureRate > 0) {
    const annualUsd = (lithium.pctWorldProduction / 100) * WORLD_MARKET_USD.lithium * captureRate;
    items.push({
      label: 'LITHIUM MINING REVENUE',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'low',
      note: `${lithium.pctWorldProduction}% world production · ${(captureRate * 100).toFixed(0)}% capture rate · BMI 2023`,
    });
  }

  // Monetary gold reserves (one-time transfer if control over central-bank assets is achieved)
  const targetGoldReservesUsd = target.goldReservesUsd ?? 0;
  const goldSeizureRate = GOLD_RESERVE_SEIZURE_RATE[scenario] ?? 0;
  if (targetGoldReservesUsd > 0 && goldSeizureRate > 0) {
    const totalUsd = targetGoldReservesUsd * goldSeizureRate;
    const annualUsd = totalUsd / Math.max(durationYears, 1);
    items.push({
      label: 'MONETARY GOLD RESERVE SEIZURE (ONE-TIME)',
      annualUsd,
      totalUsd,
      confidence: 'low',
      note: `Target monetary gold reserves ≈ ${formatCurrency(targetGoldReservesUsd)} (WB FI.RES.TOTL.CD - FI.RES.XGLD.CD) · ${(goldSeizureRate * 100).toFixed(0)}% seizure rate`,
    });
  }

  // Defense industry stimulus — aggressor domestic economy only
  // Only applies to countries with large domestic arms industries
  const aggressorBudget = aggressor.militaryBudgetUsd ?? 0;
  if (aggressorBudget > DEFENSE_STIMULUS_THRESHOLD_USD && scenario !== 'skirmish') {
    // Additional wartime spending above peacetime budget drives domestic GDP
    const additionalSpend = aggressorBudget * (def.intensityMultiplier - 0.5) * DEFENSE_GDP_MULTIPLIER;
    const annualUsd = additionalSpend;
    items.push({
      label: 'DEFENSE INDUSTRY STIMULUS',
      annualUsd,
      totalUsd: annualUsd * durationYears,
      confidence: 'low',
      note: `Domestic arms sector GDP from increased spending. Applicable to large military-industrial aggressors only. US BEA / UK DASA methodology.`,
    });
  }

  const totalUsd = items.reduce((sum, i) => sum + i.totalUsd, 0);
  const annualRateUsd = durationYears > 0 ? totalUsd / durationYears : 0;
  const netPositionUsd = totalUsd - totalCostUsd;

  // Break-even: years until cumulative revenue covers total cost
  // (at the annual rate derived from this scenario duration)
  const breakEvenYears =
    annualRateUsd > 0 ? Math.ceil(totalCostUsd / annualRateUsd) : null;

  return {
    totalUsd,
    annualRateUsd,
    items,
    netPositionUsd,
    breakEvenYears,
    assumptions: [
      'AGGRESSOR WINS AND MAINTAINS FULL TERRITORIAL CONTROL THROUGHOUT',
      'RESOURCE EXTRACTION BEGINS IN YEAR 1 AND IS SUSTAINED FOR THE FULL DURATION',
      `${(captureRate * 100).toFixed(0)}% CAPTURE RATE APPLIED — ACCOUNTS FOR EXTRACTION COSTS, RESISTANCE, AND SABOTAGE`,
      'MONETARY GOLD RESERVES (IF AVAILABLE) ARE TREATED AS A ONE-TIME STOCK TRANSFER USING WORLD BANK RESERVE INDICATORS',
      'DEFENSE STIMULUS ONLY APPLIES TO AGGRESSORS WITH MILITARY BUDGETS >$30B (DOMESTIC INDUSTRY PROXY)',
      'EXCLUDES: WAR REPARATIONS (RARELY PAID IN FULL), TERRITORY RESALE VALUE, GEOPOLITICAL LEVERAGE',
      'BEST-CASE SCENARIO — HISTORICAL REALITY IS ALMOST ALWAYS WORSE',
    ],
    confidenceNote:
      'OVERALL CONFIDENCE: LOW. NO 21ST-CENTURY WAR HAS RECOVERED ITS COSTS THROUGH RESOURCE REVENUE ALONE. IRAQ OIL DID NOT PAY FOR THE IRAQ WAR. THIS SECTION EXISTS TO SHOW WHY.',
  };
}

function formatCurrency(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
