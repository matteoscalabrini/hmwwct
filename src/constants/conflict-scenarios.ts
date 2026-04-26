import { ScenarioDefinition } from '@/types';

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  precision_strike: {
    id: 'precision_strike',
    label: 'Precision Strike Campaign',
    description:
      'Drones, cruise missiles, strategic bombers (B-52, B-2). No boots on the ground. Days to weeks.',
    examples: 'e.g. 1999 Kosovo ($4.2B, 78 days), 1998 Desert Fox ($500M, 4 days), 2024 Yemen strikes',
    durationYears: { min: 0.003, max: 0.15, point: 0.05 }, // ~1 day to ~7 weeks, point ~18 days
    intensityMultiplier: 0.7,
    // Minimal displacement — no ground occupation, aggressor doesn't push civilians out of their homes.
    // Infrastructure damage may cause some internal movement but far below any ground-war threshold.
    displacementMultiplier: 0.01,
    // Annual reconstruction rate: damaged infrastructure (power, roads, military sites) but no occupation damage.
    // Kosovo: ~$2B reconstruction for $15B GDP over 2yr = ~7%/yr. Lower bound used.
    reconstructionRate: { min: 0.01, max: 0.08, point: 0.03 },
    // Aggressor: negligible GDP impact (US economy unaffected by Kosovo strikes).
    // Target: moderate disruption — infrastructure damage, supply chain disruption, tourism/trade collapse.
    gdpImpactPct: { aggressor: 0.001, target: 0.03 },
    // High attrition: expensive munitions (Tomahawk $1.5M+, JASSM $1M+), possible drone/aircraft losses.
    equipmentAttritionPct: 0.12,
  },
  air_campaign: {
    id: 'air_campaign',
    label: 'Sustained Air Campaign',
    description:
      'Prolonged aerial bombardment and naval strikes. No ground invasion. Includes suppression of enemy air defences and strategic bombing. Weeks to months.',
    examples: 'e.g. 1999 Kosovo/Allied Force (78 days, $4.2B), 2011 Libya/Odyssey Dawn, 2026 Operation Epic Fury vs Iran',
    durationYears: { min: 0.05, max: 0.5, point: 0.15 }, // ~18 days to 6 months, point ~55 days
    intensityMultiplier: 0.9,
    // Air campaigns cause significant civilian casualties and infrastructure destruction
    // but less population displacement than ground wars. Kosovo: ~850K displaced of 1.8M (47%)
    // but Iran-scale: ~3.2M of 89M in weeks (3.6%) due to size and limited ground presence.
    // In humanitarian.ts, air_campaign uses this as a direct population share rather than
    // multiplying it by long-run UNHCR displacement ratios again.
    displacementMultiplier: 0.04,
    // Infrastructure heavily targeted (power grid, bridges, military sites, oil facilities).
    // Kosovo: ~$2B reconstruction over 2yr for $10B GDP → ~10%/yr. Libya: ~15%/yr.
    reconstructionRate: { min: 0.05, max: 0.20, point: 0.10 },
    // Aggressor: small GDP impact (US unaffected by Kosovo, small by Libya).
    // Target: severe disruption — power grid down, oil exports halted, capital flight.
    // Iran 2026: GDP expected -10% (Chatham House). Use 0.15 as point estimate.
    gdpImpactPct: { aggressor: 0.002, target: 0.15 },
    // High munitions attrition — missiles, bombs — but fewer large platforms lost vs ground war.
    // Calibrated to: Kosovo 14 aircraft lost, Iran 2026: 3 F-15EX ($103M each).
    equipmentAttritionPct: 0.08,
  },
  skirmish: {
    id: 'skirmish',
    label: 'Limited Ground War',
    description:
      'Border clashes, limited ground offensives, air support. No full-scale invasion. Weeks to months.',
    examples: 'e.g. 1999 Kargil War, 2020 Armenia–Azerbaijan, 2006 Lebanon War',
    durationYears: { min: 0.05, max: 0.5, point: 0.2 }, // ~18 days to 6 months
    intensityMultiplier: 0.4,
    // Skirmish displacement: only the immediate border/conflict zone is affected (~5% of country's
    // historical peak rate). Kargil displaced ~50,000 people out of Pakistan's 230M population.
    displacementMultiplier: 0.05,
    // Annual reconstruction rate (multiplied by durationYears in formula).
    // Kargil-equivalent: ~0.5-1% of target GDP for the conflict period.
    reconstructionRate: { min: 0.005, max: 0.02, point: 0.01 },
    // Aggressor: minimal impact (0.2% GDP/year — war spending as small share of large economy)
    // Target: 3% GDP/year — localized damage
    gdpImpactPct: { aggressor: 0.002, target: 0.03 },
    equipmentAttritionPct: 0.05,
  },
  conventional: {
    id: 'conventional',
    label: 'Full Conventional War',
    description:
      'Full-scale ground, air, and naval operations. Months to years of sustained fighting.',
    examples: 'e.g. 1991 Gulf War, 2003 Iraq invasion, 2022 Russia–Ukraine',
    durationYears: { min: 0.5, max: 3, point: 1.5 },
    intensityMultiplier: 1.0,
    // Conventional war: significant population displacement but not full historical maximum.
    // Ukraine 2022: ~15M displaced of 44M (34%). UKR historical ratio ~54% × 0.5 ≈ 27%. Reasonable.
    displacementMultiplier: 0.5,
    // Annual reconstruction rate (multiplied by durationYears in formula).
    // Iraq 2003 ($60B reconstruction, $110B GDP, 1.5yr) → ~36%/yr; Gulf War ~50%/yr. Use 20%/yr point.
    reconstructionRate: { min: 0.10, max: 0.40, point: 0.20 },
    // Aggressor: 1% GDP/year (Russia lost ~2% in 2022, US grew during Gulf War — average ~1%)
    // Target: 25% GDP/year (Iraq GDP fell ~33% in 2003 invasion year)
    gdpImpactPct: { aggressor: 0.01, target: 0.25 },
    equipmentAttritionPct: 0.15,
  },
  occupation: {
    id: 'occupation',
    label: 'Protracted Occupation',
    description:
      'Long-term military presence, counterinsurgency, and nation-building. Years to decades.',
    examples: 'e.g. 2001–2021 Afghanistan ($2.3T), 2003–2011 Iraq ($2.1T)',
    durationYears: { min: 3, max: 20, point: 10 },
    intensityMultiplier: 1.6,
    // Occupation displacement: sustained but not full historical maximum (refugees eventually settle).
    // Afghanistan: 6M actual vs 40M×26%=10.4M historical max. Multiplier ~0.6; use 0.7 for model.
    displacementMultiplier: 0.7,
    // Annual reconstruction rate (multiplied by durationYears in formula).
    // Afghanistan ($145B reconstruction, $20B GDP, 20yr) → ~36%/yr. Use 30%/yr point.
    reconstructionRate: { min: 0.15, max: 0.60, point: 0.30 },
    // Aggressor: 0.5% GDP/year (sustained drag from debt, resource diversion — US grew through Afghan war)
    // Target: 40% GDP/year (sustained destruction, governance collapse)
    gdpImpactPct: { aggressor: 0.005, target: 0.40 },
    equipmentAttritionPct: 0.10,
  },
};

// Watson Institute: daily cost estimates for US-scale conflicts
// Source: https://watson.brown.edu/costsofwar/
export const WATSON_DAILY_COST_USD = {
  precision_strike: { low: 50_000_000, high: 500_000_000 },
  // Air campaign: CSIS Iran 2026 $891M/day (100hrs), but includes heavy defensive intercepts.
  // Pure operational (sorties, fuel, maintenance): ~$196M/day. With munitions: ~$700M/day.
  // Calibrated midpoint from Kosovo ($54M/day) and Iran 2026 ($891M/day).
  air_campaign: { low: 100_000_000, high: 1_200_000_000 },
  skirmish: { low: 50_000_000, high: 500_000_000 },
  conventional: { low: 500_000_000, high: 2_000_000_000 },
  occupation: { low: 200_000_000, high: 800_000_000 },
};

// Logistics cost multiplier: each 10,000 km adds ~30% overhead
// Source: RAND Corporation logistics studies
export const LOGISTICS_KM_FACTOR = 0.03; // per 1,000 km

// UNHCR + WFP + host government total cost per displaced person per year (global average)
// UNHCR 2023 budget: $10.9B for 117M displaced = $93/person/year (UNHCR alone)
// Total humanitarian system (all actors): ~$1,200/person/year global average
// Note: Western hosting can reach $12,000/yr; developing-world hosting ~$300-500/yr
// Source: UNHCR Global Trends 2023, OCHA Financial Tracking Service
export const UNHCR_COST_PER_DISPLACED_PER_YEAR_USD = 1_200;

// WHO emergency health cost per displaced person per year (global average)
// Source: https://www.who.int/emergencies/funding
export const WHO_MEDICAL_COST_PER_DISPLACED_PER_YEAR_USD = 300;

// Sanctions cost as % of aggressor GDP per year
// IMF: Russia sanctions 2022 = ~2% real GDP contraction, but this is for severe blanket sanctions
// For conflicts without regime-scale sanctions, use 0.5% as moderate estimate
export const SANCTIONS_GDP_PCT = 0.005;

// Trade disruption factor (WTO conflict trade studies)
export const TRADE_DISRUPTION_FACTOR = 0.70;
