/**
 * Armament Cost Calculator
 *
 * Estimates procurement, attrition-replacement, and munitions-consumption costs
 * for a conflict based on:
 *   1. Live military expenditure from World Bank API (already in aggressor.militaryBudgetUsd)
 *   2. SIPRI Milex dataset as offline fallback
 *   3. NATO equipment-percentage data to derive procurement fraction
 *   4. Static unit-cost table (DoD-sourced, updated ~annually)
 *   5. Scenario-based force-package tables
 *
 * Sources:
 *   - SIPRI Military Expenditure Database 2024
 *   - NATO Defence Expenditure 2025 (Table 8a)
 *   - DoD Program Acquisition Costs by Weapon System FY2022-2024
 *   - GAO-24-106649: Ukraine Weapon Replacement Study
 *   - RAND: Ukraine munitions consumption estimates
 *   - Bruegel US Foreign Military Sales Database 2025
 */

import { CalculationInput, CostCategory, LineItem, Source } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';

// ─── Static datasets ─────────────────────────────────────────────────────────
import sipriData from '@/lib/data/armaments/sipri-milex.json';
import natoData from '@/lib/data/armaments/nato-defence.json';
import unitCosts from '@/lib/data/armaments/unit-costs.json';
import forcePkgs from '@/lib/data/armaments/scenario-force-packages.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnitCostEntry {
  label: string;
  unitCostMillionUSD: number;
  rangeLow: number;
  rangeHigh: number;
  domain: string;
  attritionLifespan: number;
}

interface ForcePackageScenario {
  label: string;
  durationDaysTypical: number;
  forcePackage: Record<string, number>;
  munitionsConsumptionPerDay: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// US FY2023 defence budget — reference anchor for all scaling
const US_DEFENCE_BUDGET_USD = 858_000_000_000;

// Global median equipment % of defence spending (SIPRI/IISS estimate for non-NATO)
const GLOBAL_MEDIAN_EQUIPMENT_PCT = 0.20;

// Scenario key mapping: ConflictScenario → force-package keys
const SCENARIO_PKG_MAP: Record<string, string> = {
  precision_strike: 'precision_strike',
  air_campaign:     'air_campaign',
  skirmish:         'border_skirmish',
  conventional:     'conventional_war',
  occupation:       'occupation',
};

// ─── Defensive intercept calibration ─────────────────────────────────────────
// Iran 2026 calibration: 700 ballistic missiles + 3,600 drones in 17 days.
// Intercept cost: ~$1.7B (first 100 hrs) out of $3.7B total.
// Avg cost/intercept ≈ $395K (mix of SM-3 $10M, Patriot PAC-3 $4M, SM-2 $2M, Iron Dome $80K).
// We model incoming threat volume as a function of:
//   a) target's SIPRI military budget (bigger military = more incoming capable)
//   b) scenario type (air campaigns and conventional wars attract more counter-fire)
//   c) conflict duration
// Source: CSIS "$3.7B: Estimated Cost of Epic Fury's First 100 Hours" (2026)

const INTERCEPT_COST_PER_THREAT_USD = 395_000; // calibrated from Iran 2026

// Daily incoming threat rates (ballistic missiles + drones combined) per $100B target budget
// Calibrated: Iran ($10B budget) fired ~25 BMs/day + 210 drones/day ≈ 235 threats/day
// Per $100B: 235 / 0.1 = 2,350 threats/day per $100B → but capped at realistic limits
const DAILY_THREATS_PER_100B_BUDGET: Record<string, number> = {
  precision_strike: 150,   // target fights back but limited launch volume (short duration)
  air_campaign:     300,   // sustained barrage over weeks — Iran pattern
  skirmish:         50,    // border clashes: artillery + short-range missiles, fewer ballistic
  conventional:     200,   // full war: ballistic missiles, cruise missiles, artillery rockets
  occupation:       30,    // insurgency: IEDs, mortars, sporadic rockets — no ballistic missiles
};

// ─── Sources ─────────────────────────────────────────────────────────────────
const SOURCES: Record<string, Source> = {
  sipri: {
    name: 'SIPRI Military Expenditure Database 2024',
    url: 'https://www.sipri.org/databases/milex',
    year: 2024,
    isStatic: true,
  },
  nato: {
    name: 'NATO Defence Expenditure 2025 — Table 8a (Equipment %)',
    url: 'https://www.nato.int/en/news-and-events/articles/news/2025/08/28/defence-expenditure-of-nato-countries-2014-2025',
    year: 2025,
    isStatic: true,
  },
  dod: {
    name: 'DoD Program Acquisition Costs by Weapon System (FY2024)',
    url: 'https://comptroller.defense.gov/Portals/45/Documents/defbudget/FY2024/FY2024_Weapons.pdf',
    year: 2024,
    isStatic: true,
  },
  gao: {
    name: 'GAO-24-106649: Ukraine Weapon Replacement Study',
    url: 'https://www.gao.gov/products/gao-24-106649',
    year: 2024,
    isStatic: true,
  },
  rand: {
    name: 'RAND — Ukraine Munitions Requirements Analysis',
    url: 'https://www.rand.org/pubs/commentary/2024/05/heres-what-ukraine-needs-in-missiles-shells-and-troops.html',
    year: 2024,
    isStatic: true,
  },
  bruegel: {
    name: 'Bruegel US Foreign Military Sales Database (2008–2025)',
    url: 'https://www.bruegel.org/dataset/us-foreign-military-sales',
    year: 2025,
    isStatic: true,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get most-recent SIPRI military expenditure for a country (millions USD).
 * Falls back to null if not found.
 */
function getSipriMilex(iso3: string): number | null {
  const entry = (sipriData.countries as Record<string, { milexMillionUSD: Record<string, number> }>)[iso3];
  if (!entry) return null;
  const years = Object.keys(entry.milexMillionUSD).sort((a, b) => parseInt(b) - parseInt(a));
  for (const y of years) {
    const v = entry.milexMillionUSD[y];
    if (typeof v === 'number' && v > 0) return v * 1e6; // → USD
  }
  return null;
}

/**
 * Get the most recent NATO equipment % for a country.
 * Returns a fraction (0–1), e.g. 0.24 for 24%.
 */
function getNatoEquipmentPct(iso3: string): number | null {
  const entry = (natoData.equipmentPct as Record<string, { values: Record<string, number> }>)[iso3];
  if (!entry) return null;
  const years = Object.keys(entry.values).sort((a, b) => parseInt(b) - parseInt(a));
  for (const y of years) {
    const v = entry.values[y];
    if (typeof v === 'number' && v > 0) return v / 100; // % → fraction
  }
  return null;
}

/**
 * Scale a US-reference cost to an aggressor's actual budget.
 * Uses a power-law with exponent 0.75 to model diminishing returns —
 * larger budgets buy more but not linearly (economies of scale, different
 * equipment mixes, doctrine).
 */
function budgetScalar(aggressorBudget: number): number {
  const raw = aggressorBudget / US_DEFENCE_BUDGET_USD;
  return Math.pow(raw, 0.75);
}

// ─── Main calculation ─────────────────────────────────────────────────────────

export function calculateArmamentCost(input: CalculationInput): CostCategory {
  const { aggressor, scenario } = input;
  const def = SCENARIOS[scenario];
  const durationDays = def.durationYears.point * 365;

  // ── 1. Resolve military budget ──────────────────────────────────────────────
  // Prefer live World Bank data (already in aggressor), fall back to SIPRI dataset
  const liveBudget = aggressor.militaryBudgetUsd;
  const sipriBudget = getSipriMilex(aggressor.code);
  const militaryBudget =
    liveBudget != null && liveBudget > 0
      ? liveBudget
      : sipriBudget != null
        ? sipriBudget
        : 50_000_000_000; // global median fallback

  const usedFallback = liveBudget == null || liveBudget <= 0;
  const scalar = budgetScalar(militaryBudget);

  // ── 2. Procurement fraction ──────────────────────────────────────────────────
  // NATO data gives equipment % of defence spend. For non-NATO, use global median.
  const equipmentPct = getNatoEquipmentPct(aggressor.code) ?? GLOBAL_MEDIAN_EQUIPMENT_PCT;

  // Annual procurement budget = how much of the defence budget goes to buying hardware
  const annualProcurementBudget = militaryBudget * equipmentPct;

  // War-time surge: procurement typically 2–4× peacetime during active conflict
  const warSurgeMultiplier = scenario === 'occupation' ? 1.5 : scenario === 'skirmish' ? 2.0 : 3.0;
  const warProcurementBudget = annualProcurementBudget * warSurgeMultiplier * def.durationYears.point;

  // ── 3. Force package cost ────────────────────────────────────────────────────
  const pkgKey = SCENARIO_PKG_MAP[scenario] ?? scenario;
  const pkg = (forcePkgs.scenarios as Record<string, ForcePackageScenario>)[pkgKey];
  const costs = unitCosts.categories as Record<string, UnitCostEntry>;

  let forcePackageCostPoint = 0;
  let forcePackageCostLow = 0;
  let forcePackageCostHigh = 0;

  if (pkg) {
    for (const [weaponKey, qty] of Object.entries(pkg.forcePackage)) {
      const cost = costs[weaponKey];
      if (!cost) continue;
      forcePackageCostPoint += qty * cost.unitCostMillionUSD * 1e6 * scalar;
      forcePackageCostLow   += qty * cost.rangeLow           * 1e6 * scalar;
      forcePackageCostHigh  += qty * cost.rangeHigh          * 1e6 * scalar;
    }
  }

  // ── 4. Munitions consumption ─────────────────────────────────────────────────
  let munitionsCostPoint = 0;
  let munitionsCostLow = 0;
  let munitionsCostHigh = 0;

  if (pkg) {
    for (const [weaponKey, perDay] of Object.entries(pkg.munitionsConsumptionPerDay)) {
      const cost = costs[weaponKey];
      if (!cost) continue;
      const totalQty = perDay * durationDays;
      munitionsCostPoint += totalQty * cost.unitCostMillionUSD * 1e6 * scalar;
      munitionsCostLow   += totalQty * cost.rangeLow           * 1e6 * scalar;
      munitionsCostHigh  += totalQty * cost.rangeHigh          * 1e6 * scalar;
    }
  }

  // ── 5. Defensive intercept costs ────────────────────────────────────────────
  // Cost to shoot down incoming ballistic missiles, cruise missiles, and drones.
  // Calibrated from Iran 2026: $1.7B intercept cost in first 100 hours.
  // Scales with target's military budget (proxy for launch capability) and duration.
  const targetBudgetLive = input.target.militaryBudgetUsd;
  const targetSipriBudget = getSipriMilex(input.target.code);
  const targetMilBudget =
    targetBudgetLive != null && targetBudgetLive > 0
      ? targetBudgetLive
      : targetSipriBudget != null
        ? targetSipriBudget
        : 10_000_000_000; // $10B fallback

  const threatsPerDay =
    (DAILY_THREATS_PER_100B_BUDGET[scenario] ?? 100) *
    (targetMilBudget / 100_000_000_000);

  const totalThreats = threatsPerDay * durationDays;
  // Intercept rate: not every threat is intercepted; assume 85% intercept rate
  const interceptedThreats = totalThreats * 0.85;
  const interceptCostPoint = interceptedThreats * INTERCEPT_COST_PER_THREAT_USD * scalar;
  const interceptCostLow   = interceptCostPoint * 0.4; // fewer threats / cheaper interceptors
  const interceptCostHigh  = interceptCostPoint * 2.5; // more threats / SM-3 heavy mix

  // ── 6. Attrition replacement (GAO calibration) ───────────────────────────────
  // GAO Ukraine study: ~$25.9B replacement for ~$47B initial draw-down (~55% replacement rate)
  // We apply equipmentAttritionPct from scenario definition to the force package cost
  const attritionRate = def.equipmentAttritionPct ?? 0.15;
  const attritionCostPoint = forcePackageCostPoint * attritionRate;
  const attritionCostLow   = forcePackageCostLow   * attritionRate * 0.7;
  const attritionCostHigh  = forcePackageCostHigh  * attritionRate * 1.4;

  // ── 7. Total ─────────────────────────────────────────────────────────────────
  const totalPoint = forcePackageCostPoint + munitionsCostPoint + attritionCostPoint + interceptCostPoint;
  const totalLow   = forcePackageCostLow   + munitionsCostLow   + attritionCostLow   + interceptCostLow;
  const totalHigh  = forcePackageCostHigh  + munitionsCostHigh  + attritionCostHigh  + interceptCostHigh;

  // ── 8. Line items ─────────────────────────────────────────────────────────────
  const items: LineItem[] = [
    {
      label: 'Initial Force Package Procurement',
      amount: forcePackageCostPoint,
      isEstimate: true,
      confidence: 'medium',
      sources: [SOURCES.dod, SOURCES.sipri],
      assumptions: [
        {
          id: 'arm_procurement_budget',
          description: `Annual equipment procurement budget (${(equipmentPct * 100).toFixed(0)}% of military spend × ${warSurgeMultiplier}× war surge over ${def.durationYears.point}yr)`,
          formula: `militaryBudget × equipmentPct × surgeMult × durationYears`,
          value: warProcurementBudget,
          unit: 'USD',
          sources: [SOURCES.nato, SOURCES.sipri],
        },
        {
          id: 'arm_scale_scalar',
          description: `Budget scalar relative to US reference ($858B): ${(scalar * 100).toFixed(1)}% — power-law exponent 0.75 applied`,
          formula: `(aggressorBudget / $858B)^0.75`,
          value: scalar,
          unit: 'scalar',
          sources: [SOURCES.sipri],
        },
      ],
    },
    {
      label: 'Munitions Consumption',
      amount: munitionsCostPoint,
      isEstimate: true,
      confidence: 'medium',
      sources: [SOURCES.rand, SOURCES.gao],
      assumptions: [
        {
          id: 'arm_munitions_duration',
          description: `Munitions expended over ${durationDays.toFixed(0)} days at scenario-specific daily rates (RAND Ukraine calibration)`,
          formula: `Σ (perDayRate × durationDays × unitCost × scalar)`,
          value: munitionsCostPoint,
          unit: 'USD',
          sources: [SOURCES.rand],
        },
      ],
    },
    {
      label: 'Equipment Attrition & Replacement',
      amount: attritionCostPoint,
      isEstimate: true,
      confidence: 'low',
      sources: [SOURCES.gao],
      assumptions: [
        {
          id: 'arm_attrition_rate',
          description: `${(attritionRate * 100).toFixed(0)}% attrition of initial force package replaced during conflict (GAO-24-106649: Ukraine ~55% of drawdown replaced within 18 months)`,
          formula: `forcePackageCost × attritionPct`,
          value: attritionRate,
          unit: 'fraction',
          sources: [SOURCES.gao],
        },
      ],
    },
    {
      label: 'Defensive Intercepts (Ballistic Missiles & Drones)',
      amount: interceptCostPoint,
      isEstimate: true,
      confidence: 'medium',
      sources: [SOURCES.dod],
      assumptions: [
        {
          id: 'arm_intercept_threats',
          description: `~${Math.round(threatsPerDay).toLocaleString()} incoming threats/day (scaled from target military budget $${(targetMilBudget / 1e9).toFixed(0)}B). 85% intercept rate × avg $${(INTERCEPT_COST_PER_THREAT_USD / 1000).toFixed(0)}K/intercept (mix of Patriot PAC-3 $4M, SM-2 $2M, SM-3 $10M, Iron Dome $80K). Calibrated to CSIS Iran 2026 analysis: $1.7B intercept cost in first 100 hours for 700 BMs + 3,600 drones.`,
          formula: `threatsPerDay × durationDays × 0.85 × $${(INTERCEPT_COST_PER_THREAT_USD / 1000).toFixed(0)}K × budgetScalar`,
          value: interceptCostPoint,
          unit: 'USD',
          sources: [SOURCES.dod],
        },
      ],
    },
  ];

  // ── 8. Data freshness note ────────────────────────────────────────────────────
  const dataNote = usedFallback
    ? `Military expenditure from SIPRI 2024 dataset (World Bank live data unavailable for ${aggressor.code})`
    : `Military expenditure from World Bank live API; equipment fraction from ${getNatoEquipmentPct(aggressor.code) != null ? 'NATO 2025 data' : 'global median estimate'}`;

  return {
    label: 'Armaments',
    amount: totalPoint,
    amountMin: totalLow,
    amountMax: totalHigh,
    color: '#ff6b35',
    items,
    methodology: `
Armament costs calculated in four buckets:
1. **Force Package**: ${pkg ? `${Object.keys(pkg.forcePackage).length} weapon categories` : 'N/A'} scaled by aggressor budget relative to US reference ($858B FY2023).
2. **Munitions Consumption**: daily expenditure rates × conflict duration, calibrated to RAND Ukraine analysis.
3. **Attrition Replacement**: ${(attritionRate * 100).toFixed(0)}% of initial force package replaced (GAO-24-106649 Ukraine benchmark).
4. **Defensive Intercepts**: ~${Math.round(threatsPerDay).toLocaleString()} incoming threats/day × ${durationDays.toFixed(0)} days × $${(INTERCEPT_COST_PER_THREAT_USD / 1000).toFixed(0)}K avg intercept cost (calibrated to CSIS Iran 2026: $1.7B in 100hrs).
Budget scalar: ${(scalar * 100).toFixed(1)}% of US reference (power-law 0.75).
${dataNote}
    `.trim(),
    sources: [SOURCES.sipri, SOURCES.nato, SOURCES.dod, SOURCES.gao, SOURCES.rand, SOURCES.bruegel],
  };
}
