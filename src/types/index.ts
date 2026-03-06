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
  dataYear: number;
  hasStaticFallback: boolean;
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

export type ConflictScenario = 'skirmish' | 'conventional' | 'occupation';

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
  label: string;
  iconName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  source: Source;
}

// ─── Human Toll ───────────────────────────────────────────────────────────────

export interface HumanToll {
  displacedPersonsMin: number;
  displacedPersonsMax: number;
  displacedPersonsPoint: number;
  source: Source;
  note: string;
}

// ─── Final Result ─────────────────────────────────────────────────────────────

export interface WarCostResult {
  total: { min: number; max: number; point: number };
  breakdown: {
    military: CostCategory;
    economic: CostCategory;
    humanitarian: CostCategory;
    reconstruction: CostCategory;
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
  };
}

// ─── Calculation Input ────────────────────────────────────────────────────────

export interface CalculationInput {
  aggressor: Country;
  target: Country;
  scenario: ConflictScenario;
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
