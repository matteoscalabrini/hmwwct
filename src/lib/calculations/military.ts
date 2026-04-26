import { CalculationInput, CostCategory, LineItem, Source } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import { haversineKm } from './haversine';

const SOURCES: Record<string, Source> = {
  watson: {
    name: 'Watson Institute Costs of War, Brown University',
    url: 'https://watson.brown.edu/costsofwar/',
    year: 2023,
    isStatic: true,
  },
  sipri: {
    name: 'SIPRI Military Expenditure Database',
    url: 'https://www.sipri.org/databases/milex',
    year: 2023,
    isStatic: true,
  },
  rand: {
    name: 'RAND Corporation — Force and Logistics Analysis',
    url: 'https://www.rand.org/topics/military-logistics.html',
    year: 2021,
    isStatic: true,
  },
};

/**
 * Watson Institute reference: US daily operational cost by scenario.
 * Afghanistan occupation averaged ~$316M/day ($2.313T over 20 years).
 * We scale by (aggressor_budget / US_reference_budget) for non-US powers.
 *
 * Source: Watson Institute "Costs of War" 2021 (Crawford)
 * US military reference budget: ~$700B (2010 average, peak Afghanistan era)
 */
/**
 * Direct operational costs per day (US-scale reference budget $700B).
 * Excludes veterans care and interest on war debt (long-term costs not captured here).
 *
 * Skirmish: Kargil-scale (~$150M/day for Pakistan-India scale, US-equivalent = ~$80M)
 * Conventional: Gulf War 1991 (~$102B total, 207 days) → $493M/day, adj for direct costs = $400M
 * Occupation: Afghanistan direct Pentagon spending ~$40B/yr avg = $110M/day
 *   Watson's $2.3T includes veterans ($300B) + interest ($500B) + homeland security.
 *   Direct operations only: ~$824B / 20yr = $41B/yr = $112M/day.
 */
const WATSON_DAILY_ANCHOR_USD: Record<string, number> = {
  // Precision strike: munitions-heavy (Tomahawk $1.5M+, JASSM $1M+), carrier battle group $8M/day,
  // B-52/B-2 long-range sorties. Calibrated to: Desert Fox ($125M/day), Allied Force ($54M/day).
  // Higher per-day than skirmish but total cost far lower due to short duration.
  precision_strike: 150_000_000, // $150M/day (US-budget-equivalent, munitions-dominant)
  // Sustained air campaign: keep direct operations conservative here. Aircraft packages,
  // munitions consumption, attrition, and defensive intercepts are priced in armaments.ts.
  air_campaign: 112_000_000,
  skirmish: 80_000_000,          // $80M/day (Kargil-scale, US-budget-equivalent direct ops)
  conventional: 400_000_000,     // $400M/day (Gulf War 1991 direct ops, inflation-adj to 2023)
  occupation: 112_000_000,       // $112M/day (Afghanistan direct Pentagon ops, $824B/20yr)
};
const US_REFERENCE_BUDGET_USD = 700_000_000_000; // $700B 2010 average

export function calculateMilitaryCost(input: CalculationInput): CostCategory {
  const { aggressor, target, scenario } = input;
  const def = SCENARIOS[scenario];

  const militaryBudget = aggressor.militaryBudgetUsd ?? 50_000_000_000;
  const durationYears = def.durationYears.point;

  // Scale Watson anchor by aggressor's military budget vs US reference
  // Watson daily rate already encodes scenario intensity AND typical logistical costs
  // (Watson measured actual Afghanistan/Gulf War expenditure, logistics included)
  // We only apply a small logistics ADJUSTMENT for extreme distance differences from baseline
  // Baseline: Watson measured US conflicts in Middle East/Central Asia (~9,000-11,000 km from US)
  const rawBudgetScale = militaryBudget / US_REFERENCE_BUDGET_USD;
  const budgetScale = Math.max(0.02, Math.min(rawBudgetScale, 3.0));
  // Apply CPI inflation scalar (FRED CPIAUCSL current / 2023 average).
  // Watson anchors are expressed in 2023 USD; the scalar keeps them current without manual updates.
  // Defaults to 1.0 when FRED key is absent, preserving prior behaviour.
  const cpiScalar = input.liveData?.cpiScalar ?? 1.0;
  const watsonDaily = (WATSON_DAILY_ANCHOR_USD[scenario] ?? WATSON_DAILY_ANCHOR_USD.occupation) * cpiScalar;
  const scaledDailyRate = watsonDaily * budgetScale;

  // Compute distance for display and for a minor adjustment only at extreme ranges
  const distanceKm = haversineKm(aggressor.latlng, target.latlng);
  // Watson baseline assumed ~10,000 km (Middle East from US). Apply DELTA only beyond that.
  const WATSON_BASELINE_KM = 10000;
  const logAdjustment = distanceKm > WATSON_BASELINE_KM
    ? 1 + ((distanceKm - WATSON_BASELINE_KM) / 10000) * 0.15  // small extra for very far
    : Math.max(0.7, distanceKm / WATSON_BASELINE_KM);           // discount for close conflicts

  const operationalCost = scaledDailyRate * durationYears * 365 * logAdjustment;
  const attritionCost = operationalCost * def.equipmentAttritionPct;
  const total = operationalCost + attritionCost;
  // Store logMult-compatible value for display
  const logMult = logAdjustment;

  // Sub-component shares of operational cost (DoD historical spending allocation)
  const personnelCost   = operationalCost * 0.35;
  const oplogCost       = operationalCost * 0.40;
  const munitionsCost   = operationalCost * 0.20;
  const c3isrCost       = operationalCost * 0.05;

  const rangeFactor = scenario === 'occupation' ? 0.5 : 0.35;
  const budgetConfidence: LineItem['confidence'] = aggressor.militaryBudgetUsd !== null ? 'high' : 'low';

  const sharedAssumptions = [
    {
      id: 'watson-anchor',
      description: `Daily cost anchored to Watson Institute: $${(watsonDaily / 1e6).toFixed(0)}M/day (${scenario} scenario, US reference${cpiScalar !== 1.0 ? `; CPI-adjusted ×${cpiScalar.toFixed(3)} from 2023 USD` : ', 2023 USD'}), scaled by ${aggressor.name} budget/US reference (${budgetScale.toFixed(2)}×${rawBudgetScale < 0.02 ? ' (floor: 0.02×)' : ''}) × ${logMult.toFixed(2)}× logistics`,
      formula: `$${(watsonDaily / 1e6).toFixed(0)}M × ${budgetScale.toFixed(2)} × ${logMult.toFixed(2)} × ${durationYears}yr = ${formatUsd(operationalCost)}`,
      value: scaledDailyRate,
      unit: 'USD/day',
      sources: [SOURCES.watson, SOURCES.sipri],
    },
    {
      id: 'logistics',
      description: `Distance ${Math.round(distanceKm).toLocaleString()} km → logistics multiplier ${logMult.toFixed(2)}×`,
      formula: distanceKm > WATSON_BASELINE_KM
        ? `1 + ((${Math.round(distanceKm).toLocaleString()} − 10,000) / 10,000) × 0.15 = ${logMult.toFixed(2)}`
        : `max(0.70, ${Math.round(distanceKm).toLocaleString()} / 10,000) = ${logMult.toFixed(2)}`,
      value: logMult,
      unit: 'multiplier',
      sources: [SOURCES.rand],
    },
  ];

  const items: LineItem[] = [
    {
      label: 'Personnel (pay, allowances, benefits)',
      amount: personnelCost,
      isEstimate: true,
      confidence: budgetConfidence,
      assumptions: [
        {
          id: 'personnel',
          description: `Personnel costs = 35% of operational total (DoD historical allocation: salaries, combat pay, benefits, rotation costs)`,
          formula: `${formatUsd(operationalCost)} × 35% = ${formatUsd(personnelCost)}`,
          value: personnelCost,
          unit: 'USD',
          sources: [SOURCES.watson, SOURCES.sipri],
        },
        ...sharedAssumptions,
      ],
      sources: [SOURCES.watson, SOURCES.sipri],
    },
    {
      label: 'Operations & logistics (fuel, transport, sustainment)',
      amount: oplogCost,
      isEstimate: true,
      confidence: budgetConfidence,
      assumptions: [
        {
          id: 'oplog',
          description: `Operations & logistics = 40% of operational total (fuel, forward base sustainment, airlift, supply chain — RAND analysis of Gulf War and OEF data)`,
          formula: `${formatUsd(operationalCost)} × 40% = ${formatUsd(oplogCost)}`,
          value: oplogCost,
          unit: 'USD',
          sources: [SOURCES.rand, SOURCES.watson],
        },
        ...sharedAssumptions,
      ],
      sources: [SOURCES.rand, SOURCES.watson],
    },
    {
      label: 'Munitions & direct combat expenditure',
      amount: munitionsCost,
      isEstimate: true,
      confidence: budgetConfidence,
      assumptions: [
        {
          id: 'munitions',
          description: `Munitions = 20% of operational total (precision-guided munitions, artillery, air ordnance — Watson Institute breakdown)`,
          formula: `${formatUsd(operationalCost)} × 20% = ${formatUsd(munitionsCost)}`,
          value: munitionsCost,
          unit: 'USD',
          sources: [SOURCES.watson],
        },
        ...sharedAssumptions,
      ],
      sources: [SOURCES.watson, SOURCES.sipri],
    },
    {
      label: 'Intelligence, surveillance & communications (C3ISR)',
      amount: c3isrCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'c3isr',
          description: `C3ISR = 5% of operational total (reconnaissance, satellite comms, cyber ops, signals intelligence)`,
          formula: `${formatUsd(operationalCost)} × 5% = ${formatUsd(c3isrCost)}`,
          value: c3isrCost,
          unit: 'USD',
          sources: [SOURCES.rand],
        },
      ],
      sources: [SOURCES.rand],
    },
    {
      label: 'Equipment attrition & replacement',
      amount: attritionCost,
      isEstimate: true,
      confidence: 'medium',
      assumptions: [
        {
          id: 'equipment-attrition',
          description: `Equipment attrition at ${(def.equipmentAttritionPct * 100).toFixed(0)}% of operational costs per ${scenario} scenario — covers combat losses, accelerated wear-out, and major maintenance (SIPRI and RAND attrition estimates for comparable conflicts)`,
          formula: `${formatUsd(operationalCost)} × ${(def.equipmentAttritionPct * 100).toFixed(0)}% = ${formatUsd(attritionCost)}`,
          value: attritionCost,
          unit: 'USD',
          sources: [SOURCES.sipri, SOURCES.rand],
        },
      ],
      sources: [SOURCES.sipri, SOURCES.rand],
    },
  ];

  return {
    label: 'Military & Defense',
    amount: total,
    amountMin: total * (1 - rangeFactor),
    amountMax: total * (1 + rangeFactor),
    color: '#1e3a5f',
    items,
    methodology: `Military costs scaled from Watson Institute benchmarks: ` +
      `$${(watsonDaily / 1e6).toFixed(0)}M/day (${scenario} scenario, US reference) × ` +
      `${budgetScale.toFixed(2)} budget scale × ${logMult.toFixed(2)} logistics factor for ${Math.round(distanceKm).toLocaleString()} km. ` +
      `Operational costs split by DoD historical allocation: personnel 35%, operations & logistics 40%, munitions 20%, C3ISR 5%. ` +
      `Equipment attrition (${(def.equipmentAttritionPct * 100).toFixed(0)}%) added separately per scenario intensity. ` +
      `These anchors are calibrated to direct operational spending rather than full life-cycle war costs; long-run veterans care, interest on war debt, and homeland-security spillovers are intentionally excluded.`,
    sources: [SOURCES.watson, SOURCES.sipri, SOURCES.rand],
  };
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
