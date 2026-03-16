// ─── Source & Citation ───────────────────────────────────────────────────────

export interface Source {
  name: string;
  url: string;
  indicator?: string;
  year: number;
  isStatic: boolean;
  pageReference?: string;
}

// ─── Country ─────────────────────────────────────────────────────────────────

export interface Country {
  code: string;       // ISO 3166-1 alpha-3 (e.g. "USA")
  code2: string;      // ISO 3166-1 alpha-2 (e.g. "US")
  name: string;
  flag: string;       // PNG URL
  flagSvg: string;
  region: string;
  subregion: string;
  latlng: [number, number]; // [lat, lng]
  area: number;       // km²
  gdp: number | null;              // USD
  population: number | null;
  militaryBudgetUsd: number | null;
  militaryPctGdp: number | null;
  militaryPersonnel: number | null;
  tradeGdpPct: number | null;
  goldReservesUsd: number | null;   // official reserves in monetary gold (USD), WB FI.RES.TOTL.CD - FI.RES.XGLD.CD
  dataYear: number;
  hasStaticFallback: boolean;
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

export type ConflictScenario = 'precision_strike' | 'skirmish' | 'conventional' | 'occupation';

export interface ScenarioDefinition {
  id: ConflictScenario;
  label: string;
  description: string;
  examples: string;
  durationYears: { min: number; max: number; point: number };
  intensityMultiplier: number;
  displacementMultiplier: number;
  reconstructionRate: { min: number; max: number; point: number };
  gdpImpactPct: { aggressor: number; target: number };
  equipmentAttritionPct: number;
}

// ─── Line Items & Categories ──────────────────────────────────────────────────

export interface Assumption {
  id: string;
  description: string;
  formula: string;
  value: number;
  unit: string;
  sources: Source[];
}

export interface LineItem {
  label: string;
  amount: number;
  isEstimate: boolean;
  confidence: 'high' | 'medium' | 'low';
  assumptions: Assumption[];
  sources: Source[];
}

export interface CostCategory {
  label: string;
  amount: number;
  amountMin: number;
  amountMax: number;
  color: string;
  items: LineItem[];
  methodology: string;
  sources: Source[];
}

// ─── Opportunity Cost ─────────────────────────────────────────────────────────

export interface OpportunityCostItem {
  id: string;
  label: string;
  iconName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  source: Source;
}

export interface OpportunityContextMetric {
  id: string;
  label: string;
  currentLabel: string;
  currentValue: number;
  currentUnit: string;
  asOf: string;
  note: string;
  sources: Source[];
}

export interface OpportunityContextResponse {
  metrics: OpportunityContextMetric[];
  fetchedAt: string;
}

// ─── Human Toll ───────────────────────────────────────────────────────────────

export interface HumanToll {
  displacedPersonsMin: number;
  displacedPersonsMax: number;
  displacedPersonsPoint: number;
  source: Source;
  note: string;
}

// ─── Revenue Estimate ─────────────────────────────────────────────────────────

export interface RevenueItem {
  label: string;
  annualUsd: number;
  totalUsd: number;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export interface WarRevenueResult {
  totalUsd: number;
  annualRateUsd: number;
  items: RevenueItem[];
  netPositionUsd: number;        // revenue - headline projected cost (almost always negative)
  breakEvenYears: number | null; // null = never
  assumptions: string[];
  confidenceNote: string;
}

// ─── Final Result ─────────────────────────────────────────────────────────────

export interface WarCostResult {
  total: { min: number; max: number; point: number }; // headline projected cost: military + humanitarian + reconstruction
  economicImpact: { min: number; max: number; point: number }; // separate macroeconomic impact, excluded from headline total
  revenue: WarRevenueResult;
  breakdown: {
    military: CostCategory;
    economic: CostCategory;
    humanitarian: CostCategory;
    reconstruction: CostCategory;
    armaments: CostCategory;
  };
  duration: { min: number; max: number; point: number; unit: 'years' };
  humanToll: HumanToll;
  assumptions: Assumption[];
  sources: Source[];
  opportunityCosts: OpportunityCostItem[];
  calculatedAt: string;
  dataFreshness: {
    worldBank: string;
    sipri: string;
    unhcr: string;
    comtrade?: string;
    acled?: string;
    fred?: string;   // present when FRED commodity prices were fetched live
    imf?: string;    // present when IMF fallback was used for GDP
  };
}

// ─── Live Data Inputs ─────────────────────────────────────────────────────────

/** Live commodity spot prices fetched from FRED (St. Louis Fed). */
export interface CommodityPrices {
  oilUsdPerBarrel: number | null;
  gasUsdPerMmbtu: number | null;
  wheatUsdPerTon: number | null;
  fetchedAt: string;
}

export interface BilateralTradeLiveData {
  tradeVolumeUsd: number;
  year: number;
  reporterM49: string;
  partnerM49: string;
  fetchedAt: string;
}

export interface AcledConflictSignal {
  country: string;
  lookbackDays: number;
  politicalViolenceEvents: number;
  reportedFatalities: number;
  fragilityMultiplier: number;
  fetchedAt: string;
}

/** Sanctions regime data for the aggressor country, from literature. */
export interface SanctionsInfo {
  regime: string;
  additionalWarSanctionsPct: number; // incremental GDP contraction/yr from war-related escalation
  note: string;
}

// ─── Calculation Input ────────────────────────────────────────────────────────

export interface CalculationInput {
  aggressor: Country;
  target: Country;
  scenario: ConflictScenario;
  /** Live external data injected by the API route; all fields optional for graceful degradation. */
  liveData?: {
    commodityPrices?: CommodityPrices;
    bilateralTrade?: BilateralTradeLiveData | null;
    acledSignal?: AcledConflictSignal | null;
    aggressorSanctions?: SanctionsInfo | null;
    /** CPI scalar = currentCPI / 2023_avg_CPI (FRED CPIAUCSL). Inflates Watson anchors forward from 2023 USD. */
    cpiScalar?: number;
  };
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface WorldBankDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

export interface WorldBankResponse {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid: string;
  lastupdated: string;
}

// ─── Static Dataset Types ─────────────────────────────────────────────────────

export interface SipriEntry {
  expenditureUsd: number | null;
  pctGdp: number | null;
  personnel: number | null;
  year: number;
}

export interface DisplacementRatio {
  idpRatio: number;
  refugeeRatio: number;
}

export interface BilateralTradePair {
  tradeVolumeUsd: number;
  year: number;
}

export interface CommodityEntry {
  pctWorldProduction: number;
  globalGdpShockUsd?: number;
  priceShockUsdPerBarrel?: number;
  priceShockPctGlobal?: number;
  foodSecurityCountriesAffected?: number;
  note: string;
}
