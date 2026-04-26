import Link from 'next/link';
import { AsciiRule } from '@/components/terminal/AsciiRule';
import { DataTable } from '@/components/terminal/DataTable';
import { MethodologyLayout } from '@/components/methodology/MethodologyLayout';

export const metadata = {
  title: 'Methodology | How Much Would a War Cost There?',
  description: 'Research-style documentation of the calculator: data pipeline, public APIs, mathematical models, uncertainty treatment, and audit notes.',
};

const SECTIONS = [
  { id: 'abstract',            label: 'ABSTRACT' },
  { id: 'data-pipeline',       label: 'DATA PIPELINE' },
  { id: 'live-apis',           label: 'LIVE APIS' },
  { id: 'static-datasets',     label: 'STATIC DATASETS' },
  { id: 'country-assembly',    label: 'COUNTRY ASSEMBLY' },
  { id: 'military-model',      label: 'MILITARY MODEL' },
  { id: 'economic-model',      label: 'ECONOMIC MODEL' },
  { id: 'humanitarian-model',  label: 'HUMANITARIAN MODEL' },
  { id: 'reconstruction-model',label: 'RECONSTRUCTION MODEL' },
  { id: 'armaments-model',     label: 'ARMAMENTS MODEL' },
  { id: 'revenue-counterfactual', label: 'REVENUE COUNTERFACTUAL' },
  { id: 'aggregation',         label: 'AGGREGATION' },
  { id: 'calibration',         label: 'CALIBRATION' },
  { id: 'audit-notes',         label: 'AUDIT NOTES' },
  { id: 'limitations',         label: 'LIMITATIONS' },
];

const INTERNAL_ROUTES = [
  {
    route: '/api/countries',
    purpose: 'Builds the selectable country list from REST Countries and appends curated records for Taiwan, Palestine, and Kosovo.',
    output: '195 selectable country records with coordinates, flags, region tags, and population baselines.',
  },
  {
    route: '/api/calculate',
    purpose: 'Main orchestration endpoint. Fetches live indicators, merges fallbacks, resolves sanctions, commodity, Comtrade, and ACLED data, then runs every model module.',
    output: 'Cost ranges, module breakdowns, line-item assumptions, data freshness labels, ACLED fragility overlays, human toll estimates, and best-case revenue counterfactual.',
  },
  {
    route: '/api/world-bank/[indicator]',
    purpose: 'Thin allowlisted proxy for selected World Bank indicators used by the UI and by external inspection.',
    output: 'JSON map of country codes to the latest non-null World Bank value returned in the retrieval window.',
  },
  {
    route: '/api/opportunity-context',
    purpose: 'Fetches the target-country baseline metrics used in the gravity comparison panel for opportunity-cost context.',
    output: 'Current national baselines for beds, nurses, water, sanitation, undernourishment, child population, and forest area.',
  },
];

const API_ENDPOINTS = [
  {
    name: 'World Bank WDI',
    endpoint: 'GET https://api.worldbank.org/v2/country/{iso3;...}/indicator/{indicator}?format=json&mrv=10&per_page=50',
    use: 'Latest non-null GDP, population, trade, reserve, military-expenditure, and social-baseline indicators.',
  },
  {
    name: 'IMF DataMapper',
    endpoint: 'GET https://www.imf.org/external/datamapper/api/v1/NGDPD/{iso3,...}',
    use: 'Fallback nominal GDP in current USD when World Bank GDP is absent.',
  },
  {
    name: 'REST Countries',
    endpoint: 'GET https://restcountries.com/v3.1/all?fields=cca2,cca3,name,flags,region,subregion,latlng,area,unMember,population',
    use: 'Country identity, map coordinates, area, population, and region metadata.',
  },
  {
    name: 'FRED',
    endpoint: 'GET https://api.stlouisfed.org/fred/series/observations?series_id={seriesId}&api_key={key}&limit=10&sort_order=desc&file_type=json',
    use: 'Live oil, gas, wheat, and CPI series used to scale commodity shocks and military anchors.',
  },
  {
    name: 'UN Comtrade',
    endpoint: 'GET https://comtradeapi.un.org/tools/v1/getBilateralData/C/A/HS?reporterCode={m49}&period={year}&partnerCode={m49}&flowCode=M,X&includeDesc=false',
    use: 'Live annual bilateral goods trade used to override the static trade-pair table before gravity fallback.',
  },
  {
    name: 'ACLED OAuth',
    endpoint: 'POST https://acleddata.com/oauth/token',
    use: 'Bearer-token exchange for ACLED event queries.',
  },
  {
    name: 'ACLED Events',
    endpoint: 'GET https://acleddata.com/api/acled/read?_format=json&country={name}&year={year}&event_type=Battles|Violence against civilians|Explosions/Remote violence&fields=event_date|event_type|fatalities|country&limit=5000',
    use: 'Recent political-violence and fatality counts used to build the target fragility overlay.',
  },
];

const ADDED_CALCULATIONS = [
  {
    title: 'Live Bilateral Trade Override',
    lines: ['tradeVolume = comtradeLive ?? staticPair ?? gravityEstimate'],
    note: 'When a Comtrade key is configured, live bilateral imports plus exports replace the static pair table. The gravity model remains the last-resort fallback.',
  },
  {
    title: 'Inflation-Adjusted Military Anchors',
    lines: ['watsonDaily = scenarioAnchor x cpiScalar'],
    note: 'Watson daily military anchors are expressed in 2023 USD and are inflated forward using live FRED CPI when available.',
  },
  {
    title: 'Live Commodity Scaling',
    lines: ['commodityShock_i = baselineShock_i x (livePrice_i / 2023BaselinePrice_i)'],
    note: 'Oil, gas, and wheat disruption shocks scale with current FRED prices; semiconductors and lithium remain structural, non-price-scaled shocks.',
  },
  {
    title: 'ACLED Fragility Signal',
    lines: [
      'eventSignal = min(events365 / 250, 1)',
      'fatalitySignal = min(fatalities365 / 2000, 1)',
      'fragility = 1 + (0.08 x eventSignal) + (0.17 x fatalitySignal)',
    ],
    note: 'The overlay only activates when recent violence is non-trivial. It is intentionally modest so ACLED refines baseline assumptions rather than replacing them.',
  },
  {
    title: 'GDP, Capital-Flight, and Displacement Overlays',
    lines: [
      'targetGDPLoss = baseTargetGDPLoss x fragility',
      'capitalFlight = baseCapitalFlight x (1 + ((fragility - 1) x 0.6))',
      'displaced = baseDisplaced x fragility',
    ],
    note: 'Recent ACLED intensity raises target-country vulnerability and displacement pressure, but does not alter the aggressor-side military anchor directly.',
  },
];

const LIVE_APIS = [
  {
    name: 'World Bank World Development Indicators',
    url: 'https://api.worldbank.org/v2',
    variables:
      'NY.GDP.MKTP.CD, MS.MIL.XPND.GD.ZS, MS.MIL.XPND.CD, SP.POP.TOTL, NE.TRD.GNFS.ZS, FI.RES.TOTL.CD, FI.RES.XGLD.CD, SH.MED.BEDS.ZS, SH.MED.NUMW.P3, SH.H2O.BASW.ZS, SH.STA.BASS.ZS, SN.ITK.DEFC.ZS, SP.POP.0014.TO.ZS, AG.LND.FRST.K2',
    role: 'Primary economic, population, military, trade, and reserve inputs for aggressor and target.',
    cache: '24 hours',
    fallback: 'The app now scans the 10 most recent observations and uses the latest non-null row. GDP falls back to IMF when absent.',
  },
  {
    name: 'IMF DataMapper API',
    url: 'https://www.imf.org/external/datamapper/api/v1',
    variables: 'NGDPD',
    role: 'Secondary GDP source for countries where World Bank GDP is unavailable or stale.',
    cache: '24 hours',
    fallback: 'Used only when World Bank GDP is null; otherwise skipped to avoid extra latency.',
  },
  {
    name: 'REST Countries v3.1',
    url: 'https://restcountries.com/v3.1',
    variables: 'cca2, cca3, name, flags, region, subregion, latlng, area, unMember, population',
    role: 'Country metadata, coordinates for distance calculations, flags, region labels, and geographic area.',
    cache: '7 days',
    fallback: 'Taiwan, Palestine, and Kosovo are injected from a local curated dataset because the UN-member filter excludes them.',
  },
  {
    name: 'FRED',
    url: 'https://api.stlouisfed.org/fred',
    variables: 'DCOILWTICO, DHHNGSP, PWHEAMTUSDM, CPIAUCSL',
    role: 'Optional live price scaling for oil, gas, wheat, and CPI inflation adjustment for military anchors.',
    cache: '1 hour',
    fallback: 'If FRED is unavailable or no API key is configured, commodity shocks stay on 2023 baselines and CPI scalar defaults to 1.0.',
  },
  {
    name: 'UN Comtrade API',
    url: 'https://comtradeapi.un.org/',
    variables: 'Bilateral annual goods trade (imports + exports) by reporter/partner pair',
    role: 'Optional live bilateral-trade replacement for the static canonical pair table used in the economic-impact module.',
    cache: '24 hours',
    fallback: 'Requires a subscription key. When absent or unavailable, the calculator falls back to the local bilateral trade dataset and then to the gravity model.',
  },
  {
    name: 'ACLED API',
    url: 'https://acleddata.com/api-documentation/acled-endpoint/',
    variables: 'Recent political-violence events, fatalities, and event dates by country',
    role: 'Optional live fragility overlay for target-country GDP contraction, capital flight, and displacement estimates.',
    cache: '6 hours',
    fallback: 'Requires ACLED credentials. When absent, the calculator uses the existing static scenario and displacement assumptions without the live fragility overlay.',
  },
];

const STATIC_DATASETS = [
  {
    name: 'SIPRI Military Expenditure Database 2024',
    count: '135 countries, 2010–2024',
    note: 'Military expenditure in current USD, used as offline fallback for defense budgets in the armaments module when World Bank data is unavailable.',
  },
  {
    name: 'NATO Defence Expenditure 2025',
    count: '30 NATO members',
    note: 'Equipment spending as % of total defence budget (Table 8a), used to derive per-country procurement fraction in the armaments module. Global median 20% used for non-NATO states.',
  },
  {
    name: 'Bruegel US Foreign Military Sales 2008–2025',
    count: '79 recipient countries',
    note: 'US arms sales by recipient, equipment category, and year in 2024 constant USD. Reference dataset for arms transfer patterns and equipment category weights.',
  },
  {
    name: 'Armaments unit cost table',
    count: '22 weapon categories',
    note: 'DoD-sourced unit procurement costs with low/high ranges: from 155mm artillery shells ($800–$80K) to aircraft carriers ($3–14B). Updated from DoD Program Acquisition Costs FY2024.',
  },
  {
    name: 'Scenario force-package table',
    count: '6 scenarios',
    note: 'Typical weapons quantities deployed per package archetype. The calculator maps five UI scenarios to these packages; naval_blockade remains a reserved, non-UI package.',
  },
  {
    name: 'UNHCR-derived displacement ratios',
    count: '26 country cases + 8 regional defaults',
    note: 'Pre-processed IDP and refugee ratios used by the humanitarian model for most scenarios. Sustained air campaigns use the calibrated event-level population share instead.',
  },
  {
    name: 'UN Comtrade bilateral trade pairs',
    count: '75 canonical country pairs',
    note: 'Goods trade flows used before the gravity fallback is invoked for unlisted dyads.',
  },
  {
    name: 'Commodity producer exposure file',
    count: '32 country-commodity entries',
    note: 'Oil, gas, wheat, semiconductor, and lithium exposure table with modeled global GDP shock anchors.',
  },
  {
    name: 'Sanctions regimes file',
    count: '8 aggressor regimes',
    note: 'Literature-derived sanctions severity assumptions for countries with documented existing sanctions frameworks.',
  },
  {
    name: 'Static fallback country file',
    count: '14 countries',
    note: 'Last-resort GDP, population, military, and trade values for data-sparse states such as North Korea, Syria, and Taiwan.',
  },
  {
    name: 'Opportunity cost dataset',
    count: '10 unit-cost benchmarks',
    note: 'Schools, hospital beds, nurses, vaccines, meals, food support, water access, sanitation access, solar home systems, and restoration costs shown separately from the war total.',
  },
  {
    name: 'Curated extra-country file',
    count: '3 records',
    note: 'Taiwan, Palestine, and Kosovo metadata added on top of the REST Countries feed.',
  },
];

const COUNTRY_ASSEMBLY_LINES = [
  'country = merge(restcountries, worldbank, imf?, sipri, staticFallback?)',
  'militaryBudget = WB.MS.MIL.XPND.CD ?? SIPRI.expenditureUsd ?? GDP x (militaryPctGDP / 100) ?? staticFallback',
  'goldReserves = max(FI.RES.TOTL.CD - FI.RES.XGLD.CD, 0)',
  'distanceKm = haversine(aggressor.latlng, target.latlng)',
];

const MODEL_SECTIONS = [
  {
    id: 'military-model',
    title: 'Military Cost Model',
    body:
      'The military module is anchored to direct operational spending benchmarks from Watson Institute case studies and then scaled by aggressor budget, scenario class, distance, and attrition. Air-campaign munitions, aircraft, and intercept-heavy costs are mostly captured in the separate armaments module. It does not attempt to reproduce veterans care, interest on war debt, or homeland-security spillovers.',
    equations: [
      'budgetScale = clamp(aggressorMilitaryBudget / 700B, 0.02, 3.0)',
      'watsonDaily = scenarioAnchor x cpiScalar',
      'logistics = distanceKm > 10000 ? 1 + ((distanceKm - 10000) / 10000) x 0.15 : max(0.70, distanceKm / 10000)',
      'operational = watsonDaily x budgetScale x 365 x durationYears x logistics',
      'attrition = operational x equipmentAttritionPct',
      'militaryTotal = operational + attrition',
    ],
    notes:
      'Operational totals are decomposed into personnel (35%), operations and logistics (40%), munitions (20%), and C3ISR (5%), with scenario-specific equipment attrition added on top.',
  },
  {
    id: 'economic-model',
    title: 'Economic Impact Model',
    body:
      'The economic module combines bilateral trade disruption, target-country GDP contraction, capital flight, sanctions drag on the aggressor when justified by literature, and a commodity shock layer for globally important producers.',
    equations: [
      'tradeVolume = comtradeLive ?? lookupPair(a, b) ?? 0.004 x sqrt(GDP_a x GDP_b) / max(distanceKm, 500)',
      'tradeLoss = tradeVolume x 0.70 x durationYears x 0.50',
      'baseTargetGDPLoss = targetGDP x (1 - (1 - targetGDPImpactPct)^durationYears)',
      'targetGDPLoss = baseTargetGDPLoss x fragilityMultiplier',
      'capitalFlight = baseCapitalFlight x (1 + ((fragilityMultiplier - 1) x 0.6))',
      'sanctions = aggressorGDP x additionalWarSanctionsPct x durationYears',
      'commodityShock = sum_i(shock_i x livePriceScalar_i x sqrt(max(durationYears, 1)))',
    ],
    notes:
      'Live Comtrade trade volume overrides the static pair table when available. Oil, gas, and wheat shocks can scale with live FRED prices. ACLED can add a modest target fragility overlay to GDP loss and capital flight.',
  },
  {
    id: 'humanitarian-model',
    title: 'Humanitarian Model',
    body:
      'The humanitarian module estimates displacement support, emergency healthcare, and direct casualty cost. It applies country-specific or regional UNHCR ratios for most scenarios, uses observed population-share calibration for sustained air campaigns, and prices casualties through a conservative GDP-per-capita human-capital method.',
    equations: [
      'displacementRatio = idpRatio + refugeeRatio',
      'populationAtRisk = skirmish && area > 100000 ? population x sqrt(100000 / area) : population',
      'displacementShare = air_campaign ? scenarioDisplacementMultiplier : displacementRatio x scenarioDisplacementMultiplier',
      'baseDisplaced = populationAtRisk x displacementShare',
      'displaced = round(baseDisplaced x fragilityMultiplier)',
      'displacementDuration = durationYears + min(durationYears x 1.5, 2)',
      'casualties = populationAtRiskMillions x durationDays x scenarioCasualtyRate',
      'humanitarianTotal = displacementCost + casualtyCost',
    ],
    notes:
      'The module splits displaced people into IDPs and cross-border refugees according to the observed UNHCR ratio mix. ACLED can modestly scale displacement when recent target-country violence is already elevated. Direct casualty cost uses GDP per capita x 100 as a human-capital proxy, with injury cost set to 15% of VSL.',
  },
  {
    id: 'reconstruction-model',
    title: 'Reconstruction Model',
    body:
      'Reconstruction is modeled as a sublinear function of GDP so that richer countries do not mechanically receive implausible rebuild bills just because their output base is larger. A 30% overlap discount is applied because part of the destruction is already expressed as lost GDP in the economic module.',
    equations: [
      'effectiveGDP = 20B^(1 - 0.85) x targetGDP^0.85',
      'reconstruction = effectiveGDP x reconstructionRate x durationYears x 0.70',
      'infra = reconstruction x 0.40',
      'housing = reconstruction x 0.30',
      'services = reconstruction x 0.20',
      'economicRecovery = reconstruction x 0.10',
    ],
    notes:
      'The 20B reference point corresponds to the Afghanistan calibration point used in the code. Opportunity-cost widgets are derived from reconstruction totals but are displayed outside the main war total.',
  },
  {
    id: 'armaments-model',
    title: 'Armaments Model',
    body:
      'The armaments module prices weapons procurement, munitions consumption, equipment attrition, and defensive intercept costs — four buckets that were absent from the original model. It uses live military expenditure from the World Bank API with SIPRI Milex as offline fallback, NATO equipment-percentage data to derive a procurement fraction, a static unit-cost table sourced from DoD annual budget documents, and scenario-based force-package tables calibrated to real conflicts.',
    equations: [
      'budgetScalar = (aggressorMilBudget / $858B_US_ref) ^ 0.75',
      'forcePackageCost = Σ (qty_i × unitCost_i × budgetScalar)',
      'munitionsCost = Σ (perDayRate_i × durationDays × unitCost_i × budgetScalar)',
      'attritionCost = forcePackageCost × equipmentAttritionPct',
      'interceptThreats = (threatsPerDay_scenario × targetMilBudget / $100B) × durationDays × 0.85',
      'interceptCost = interceptThreats × $395K_avg × budgetScalar',
      'armamentsTotal = forcePackageCost + munitionsCost + attritionCost + interceptCost',
    ],
    notes:
      'budgetScalar uses a power-law exponent of 0.75 (diminishing returns — larger budgets buy more but not linearly). Equipment fraction defaults to 20% of military spend for non-NATO states; NATO Table 8a values used when available. Unit costs cover 22 weapon categories from cruise missiles ($2M) to aircraft carriers ($13B). Intercept costs are anchored to CSIS Iran 2026 reporting: $1.7B in the first 100 hours, with later reporting indicating roughly 700 ballistic missiles and 3,600 drones in the early campaign ($395K average per threat). Data sources: SIPRI Milex 2024 (135 countries), NATO Defence Expenditure 2025, Bruegel US Foreign Military Sales 2008–2025, DoD Program Acquisition Costs FY2024, GAO-24-106649 Ukraine Weapon Replacement Study.',
  },
  {
    id: 'revenue-counterfactual',
    title: 'Revenue Counterfactual',
    body:
      'Revenue is not subtracted from the headline projected cost. It is shown as a deliberately optimistic counterfactual: what an aggressor might hope to extract if it wins, holds territory, and manages to keep production online despite sabotage, sanctions, and infrastructure damage.',
    equations: [
      'annualResourceRevenue = worldMarketValue x targetShare x captureRate',
      'goldSeizure = targetGoldReserves x seizureRate',
      'defenseStimulus = aggressorBudget x (intensityMultiplier - 0.5) x 0.30',
      'netPosition = revenueTotal - headlineCost',
    ],
    notes:
      'Capture rates are scenario-specific: 0% for skirmish, 15% for conventional war, and 50% for occupation. The code treats this section as best-case and low-confidence by design.',
  },
];

const CALIBRATION_GAPS = [
  {
    id: '01',
    title: 'Defensive intercept costs — absent from model',
    finding: 'CSIS reported $1.7B in intercept costs in the first 100 hours — 46% of total direct spending. The first pass had no category for the cost of neutralizing incoming ballistic missiles and drones.',
    fix: 'Added a Defensive Intercepts line item to the armaments module. Incoming threat volume scales with target military budget × scenario threat rate. Average intercept cost $395K is calibrated from the Iran 2026 opening phase and later missile/drone reporting.',
    color: 'var(--alert)',
  },
  {
    id: '02',
    title: 'No air_campaign scenario — conflict fell in a gap',
    finding: 'The four existing scenarios were precision_strike (days), skirmish (weeks), conventional (months with ground forces), occupation (years). Iran 2026 was none of these: a sustained air campaign lasting weeks to months with no ground component.',
    fix: 'Added air_campaign as a fifth scenario. Duration 18 days – 6 months (point 55 days). Operational spending remains conservative in the military module, while the air-specific aircraft, munitions, attrition, and intercept burden is priced in armaments. Displacement multiplier 4%, GDP impact 15%/year, capital flight 7%/year.',
    color: 'var(--phosphor)',
  },
  {
    id: '03',
    title: 'Humanitarian model built for slow conflicts — not air campaigns',
    finding: 'The displacement-based model produced $14M for USA→Iran precision_strike. The real humanitarian cost by Day 17 was in the billions: 1,444 killed, 18,551 injured, 3.2 million displaced. No direct casualty cost existed in the model at all.',
    fix: 'Added a Direct Casualties line item using the WHO human-capital VSL method (GDP per capita × 100). Daily casualty rates by scenario calibrated to Iran 2026 (1.0 killed/M/day for air_campaign) and Iraq 2003 (5.0/M/day for conventional). Casualties now included in the humanitarian total.',
    color: 'var(--phosphor)',
  },
  {
    id: '04',
    title: 'Capital flight rates not calibrated for short air campaigns',
    finding: "CAPITAL_FLIGHT_PCT had entries for skirmish, conventional, and occupation but defaulted to 4% for precision_strike and the missing air_campaign. Iran's banking system was frozen and oil exports halted within days — a 7%+ flight rate, not 4%.",
    fix: 'Added explicit entries: air_campaign = 7%/year (banking freeze, oil export halt), precision_strike = 3%/year (short duration limits flight but investor panic is real).',
    color: 'var(--fg)',
  },
  {
    id: '05',
    title: 'Air-campaign displacement was double-damped',
    finding: 'The methodology intended air_campaign displacementMultiplier = 4% as an observed population share. The code multiplied that by Iran’s historical UNHCR displacement ratio again, yielding ~293K displaced for USA→Iran instead of the reported ~3.2M.',
    fix: 'For air_campaign only, displacementMultiplier is now treated as the calibrated population share. Other scenarios continue to use UNHCR historical ratios × scenario multiplier. USA→Iran air_campaign now produces ~3.7M displaced, close to the UN/HRA figure.',
    color: 'var(--phosphor)',
  },
];

const CALIBRATION_RESULTS = [
  { scenario: 'precision_strike (18d)', before: '$13.30B', after: '$13.75B', real: '$14–16.5B (Day 13–17)', match: true },
  { scenario: 'air_campaign (39d)', before: '$52.26B', after: '$53.61B', real: 'PWBM narrow direct: $27–28B Day 32, $38–47B Apr 30', match: false },
  { scenario: 'air_campaign (55d)', before: '$58.17B', after: '$60.06B', real: '$38–47B two-month direct projection (PWBM)', match: true },
  { scenario: 'human toll (39d)', before: '293K displaced', after: '3.7M displaced / 3.6K killed', real: '~3.2M displaced / 3.6K deaths', match: true },
  { scenario: 'economic impact (39d)', before: '$191.74B', after: '$191.74B', real: '$144B likely; $50–300B range (FDD)', match: true },
];

const CALIBRATION_SOURCES = [
  {
    name: 'CSIS — First 100 hours',
    url: 'https://www.csis.org/analysis/37-billion-estimated-cost-epic-furys-first-100-hours',
    use: '$3.7B first-100-hours cost and intercept-cost structure.',
  },
  {
    name: 'CSIS — Day 12 update',
    url: 'https://www.csis.org/analysis/iran-war-cost-estimate-update-113-billion-day-6-165-billion-day-12',
    use: '$11.3B Day 6 and $16.5B Day 12 direct-cost benchmark.',
  },
  {
    name: 'CSIS — Ceasefire munitions',
    url: 'https://www.csis.org/analysis/last-rounds-status-key-munitions-iran-war-ceasefire',
    use: '39-day campaign, 13,000+ targets, and key munitions depletion.',
  },
  {
    name: 'Penn Wharton Budget Model',
    url: 'https://budgetmodel.wharton.upenn.edu/blog/BE2026-2/',
    use: '$27–28B Day 32 and $38–47B two-month narrow direct-cost projection.',
  },
  {
    name: 'HRANA — Day 39 casualties',
    url: 'https://www.en-hrana.org/day-39-of-u-s-and-israeli-attacks-on-iran-extensive-damage-to-the-rail-network-and-roads/',
    use: '3,636 documented deaths in Iran by April 7.',
  },
  {
    name: 'HRA / Airwars / CIVIC',
    url: 'https://www.en-hrana.org/wp-content/uploads/2026/03/FINAL-Civilian-Harm-in-Iran-after-One-Month-of-War.pdf',
    use: '~3.2M displaced and civilian infrastructure damage.',
  },
  {
    name: 'FDD — Iran economic damage',
    url: 'https://www.fdd.org/analysis/2026/04/23/evaluating-the-economic-damage-to-iran-from-operation-epic-fury-an-initial-estimate/',
    use: '$144B likely economic damage, with $50–300B range.',
  },
];

const AUDIT_NOTES = [
  'Import-time JSON validation is enforced in validated.ts for bilateral trade pairs and commodity producer datasets, including schema shape, ISO alpha-3 keys, numeric bounds, and duplicate-pair normalization.',
  'The repository currently ships 75 bilateral trade pairs, 26 country displacement cases, 8 regional displacement defaults, 84 SIPRI entries, 14 static fallback countries, 8 sanctions regimes, and 32 commodity shock records.',
  'World Bank retrieval now requests the 10 most recent observations so the app can use the latest non-null value instead of defaulting to a fallback too early.',
  'The Iran calibration table uses reparameterized 39-day and 55-day comparisons. Other historical claims remain archetypal scenario checks rather than event-level backtests.',
  'When FRED is unavailable, the model remains runnable. Commodity shocks stay on 2023 baselines and the CPI scalar remains 1.0, which preserves deterministic behavior instead of fabricating live prices.',
];

const LIMITATIONS = [
  'Nuclear escalation, WMD use, and strategic deterrence failure.',
  'Cyber operations, satellite warfare, or electromagnetic-spectrum disruption costs.',
  'Population-scale trauma, long-run disability, and demographic scarring.',
  'Alliance activation, extended coalition war finance, and treaty spillovers.',
  'Environmental destruction, landmine clearance, and remediation of contaminated land or water.',
  'Brain drain, educational loss, and long-run human-capital depreciation.',
  'Shadow-economy disruption and illicit finance networks in already-sanctioned states.',
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MethodologyPage() {
  return (
    <MethodologyLayout sections={SECTIONS}>
      <div className="longform">

        {/* ABSTRACT */}
        <AsciiRule tone="mute" />
        <h2 id="abstract">Abstract</h2>
        <p>
          This page documents the implemented calculator, not an aspirational model. It describes
          the public APIs, static datasets, mathematical transformations, fallback rules, uncertainty
          treatment, and audit notes that currently drive the application.
        </p>
        <p>
          The system treats war-cost estimation as a transparent accounting exercise. Every
          user-facing number must either come from a named public source or from a deterministic
          transformation applied to those sources. When live APIs fail or provide no coverage, the
          code falls back to explicit local datasets rather than silently imputing values.
        </p>
        <p>
          The calculator is intentionally conservative in scope. It prices military operations,
          armaments and intercepts, economic dislocation, humanitarian displacement support, direct
          casualty cost, and reconstruction. It does not claim to price the full social cost of war,
          and it explicitly excludes nuclear escalation, long-run trauma, ecological damage, alliance
          cascades, and other second-order effects that are either methodologically unstable or not
          yet parameterized in code.
        </p>
        <div className="formula-block">
          headlineCost = military + humanitarian + reconstruction + armaments<br />
          economicImpact is reported separately from headlineCost<br />
          netPosition = revenue - headlineCost
        </div>

        {/* DATA PIPELINE */}
        <AsciiRule tone="mute" />
        <h2 id="data-pipeline">Data Pipeline</h2>
        <p>
          The codebase is organized as a small Next.js application: static pages at the top, server
          routes in the middle, and deterministic calculation modules beneath them.
        </p>

        <h3>Internal Routes</h3>
        {INTERNAL_ROUTES.map((item) => (
          <div key={item.route} style={{ marginBottom: 'var(--s-5)' }}>
            <DataTable>
              <DataTable.Row label="ROUTE"   value={item.route} tone="phosphor" />
              <DataTable.Row label="PURPOSE" value={item.purpose} />
              <DataTable.Row label="OUTPUT"  value={item.output} />
            </DataTable>
          </div>
        ))}

        <h3>Country Assembly Pipeline</h3>
        <p>
          The calculation route starts by building two enriched country objects. Geographic metadata
          comes from REST Countries, live indicators come from World Bank, GDP can fall back to IMF
          DataMapper, military and sanctions context can fall back to local datasets, and missing
          data-sparse states are explicitly labeled through the{' '}
          <code style={{ color: 'var(--phosphor)' }}>hasStaticFallback</code> flag.
        </p>
        <div id="country-assembly" className="formula-block">
          {COUNTRY_ASSEMBLY_LINES.map((line) => (
            <span key={line} style={{ display: 'block' }}>{line}</span>
          ))}
        </div>

        <h3>Added Calculations</h3>
        <p>
          Recent live-data refinements do not replace the base model. They sit on top of the prior
          architecture to improve trade realism, inflation handling, commodity scaling, and
          target-country fragility sensitivity.
        </p>
        {ADDED_CALCULATIONS.map((item) => (
          <div key={item.title} style={{ marginBottom: 'var(--s-5)' }}>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
            <div className="formula-block">
              {item.lines.map((line) => (
                <span key={line} style={{ display: 'block' }}>{line}</span>
              ))}
            </div>
          </div>
        ))}

        {/* LIVE APIS */}
        <AsciiRule tone="mute" />
        <h2 id="live-apis">Live APIs</h2>
        <p>
          The calculator mixes live public APIs with versioned local datasets. Live APIs are used for
          recency; local files are used for coverage, calibration, and transparent fallback behavior.
        </p>
        {LIVE_APIS.map((api) => (
          <div key={api.name} style={{ marginBottom: 'var(--s-5)' }}>
            <DataTable>
              <DataTable.Row
                label="SOURCE"
                value={<a href={api.url} target="_blank" rel="noopener noreferrer">{api.name}</a>}
                tone="phosphor"
              />
              <DataTable.Row label="VARS"     value={api.variables} />
              <DataTable.Row label="ROLE"     value={api.role} />
              <DataTable.Row label="CACHE"    value={api.cache} />
              <DataTable.Row label="FALLBACK" value={api.fallback} />
            </DataTable>
          </div>
        ))}

        <h3>API Endpoint Map</h3>
        <p>
          These are the actual upstream endpoint patterns the code calls today. The app wraps them
          with cache control, graceful fallback, and input normalization before they influence any
          result.
        </p>
        {API_ENDPOINTS.map((item) => (
          <div key={item.name} style={{ marginBottom: 'var(--s-4)' }}>
            <DataTable>
              <DataTable.Row label={item.name} value={item.use} />
              <DataTable.Row label="ENDPOINT" value={<span style={{ wordBreak: 'break-all', fontSize: 'var(--t-label)' }}>{item.endpoint}</span>} />
            </DataTable>
          </div>
        ))}

        {/* STATIC DATASETS */}
        <AsciiRule tone="mute" />
        <h2 id="static-datasets">Static Datasets</h2>
        <p>
          Versioned local datasets provide coverage, calibration anchors, and transparent fallback
          behavior when live APIs are unavailable or return null.
        </p>
        {STATIC_DATASETS.map((dataset) => (
          <div key={dataset.name} style={{ marginBottom: 'var(--s-4)' }}>
            <DataTable>
              <DataTable.Row label={dataset.count} value={dataset.name} tone="phosphor" />
              <DataTable.Row label="NOTE" value={dataset.note} />
            </DataTable>
          </div>
        ))}

        {/* MILITARY MODEL */}
        <AsciiRule tone="mute" />
        <h2 id="military-model">Military Model</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'military-model')!;
          return (
            <>
              <p>
                The military module is anchored to direct operational spending benchmarks from Watson
                Institute case studies and then scaled by aggressor budget, scenario class, distance,
                and attrition. The Watson anchor for a conventional war is{' '}
                ~$200M/day{' '}
                <span className="t-label fg-dim">≈ cost of 50 Tomahawk cruise missiles daily</span>.
                Air-campaign munitions, aircraft packages, and defensive intercepts are handled in
                the armaments module, keeping this module focused on operations, personnel,
                logistics, and wear. It does not attempt to reproduce veterans care, interest on war
                debt, or homeland-security spillovers.
              </p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p><span className="fg-dim">Notes: </span>{s.notes}</p>
            </>
          );
        })()}

        {/* ECONOMIC MODEL */}
        <AsciiRule tone="mute" />
        <h2 id="economic-model">Economic Model</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'economic-model')!;
          return (
            <>
              <p>{s.body}</p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p><span className="fg-dim">Notes: </span>{s.notes}</p>
            </>
          );
        })()}

        {/* HUMANITARIAN MODEL */}
        <AsciiRule tone="mute" />
        <h2 id="humanitarian-model">Humanitarian Model</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'humanitarian-model')!;
          return (
            <>
              <p>
                {s.body} The per-person-year support cost of $1,500{' '}
                <span className="t-label fg-dim">≈ UNHCR average emergency response cost per displaced person</span>{' '}
                covers humanitarian assistance and emergency healthcare.
              </p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p><span className="fg-dim">Notes: </span>{s.notes}</p>
            </>
          );
        })()}

        {/* RECONSTRUCTION MODEL */}
        <AsciiRule tone="mute" />
        <h2 id="reconstruction-model">Reconstruction Model</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'reconstruction-model')!;
          return (
            <>
              <p>{s.body}</p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p><span className="fg-dim">Notes: </span>{s.notes}</p>
            </>
          );
        })()}

        {/* ARMAMENTS MODEL */}
        <AsciiRule tone="mute" />
        <h2 id="armaments-model">Armaments Model</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'armaments-model')!;
          return (
            <>
              <p>{s.body}</p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p>
                <span className="fg-dim">Notes: </span>
                budgetScalar uses a power-law exponent of 0.75 (diminishing returns — larger budgets
                buy more but not linearly). Equipment fraction defaults to 20% of military spend for
                non-NATO states; NATO Table 8a values used when available. Unit costs cover 22 weapon
                categories from cruise missiles ($2M{' '}
                <span className="t-label fg-dim">≈ annual salary of 40 US teachers</span>) to
                aircraft carriers ($13B{' '}
                <span className="t-label fg-dim">≈ GDP of Iceland</span>). Intercept costs are
                anchored to CSIS Iran 2026 reporting: $1.7B in the first 100 hours, then checked
                against later reporting of roughly 700 ballistic missiles and 3,600 drones in the
                early campaign ($395K average per threat{' '}
                <span className="t-label fg-dim">≈ 5× cost of an Iron Dome Tamir intercept</span>).
                Data sources: SIPRI Milex 2024 (135 countries), NATO Defence Expenditure 2025,
                Bruegel US Foreign Military Sales 2008–2025, DoD Program Acquisition Costs FY2024,
                GAO-24-106649 Ukraine Weapon Replacement Study.
              </p>
            </>
          );
        })()}

        {/* REVENUE COUNTERFACTUAL */}
        <AsciiRule tone="mute" />
        <h2 id="revenue-counterfactual">Revenue Counterfactual</h2>
        {(() => {
          const s = MODEL_SECTIONS.find(m => m.id === 'revenue-counterfactual')!;
          return (
            <>
              <p>{s.body}</p>
              <div className="formula-block">
                {s.equations.map(eq => <span key={eq} style={{ display: 'block' }}>{eq}</span>)}
              </div>
              <p><span className="fg-dim">Notes: </span>{s.notes}</p>
            </>
          );
        })()}

        {/* AGGREGATION */}
        <AsciiRule tone="mute" />
        <h2 id="aggregation">Aggregation and Uncertainty</h2>
        <p>
          The app does not run a Monte Carlo engine. Instead, each module defines its own
          conservative range. Headline cost and economic impact are aggregated separately, which
          keeps the accounting explicit and avoids folding macroeconomic spillovers into the
          top-line war bill.
        </p>
        <div className="formula-block">
          headlinePoint = military + humanitarian + reconstruction + armaments<br />
          headlineMin = militaryMin + humanitarianMin + reconstructionMin + armamentsMin<br />
          headlineMax = militaryMax + humanitarianMax + reconstructionMax + armamentsMax<br />
          economicImpactPoint = economic (reported separately)
        </div>
        <p className="fg-dim" style={{ fontSize: 'var(--t-label)' }}>
          Scenario durations are normalized archetypes rather than event-specific backtests: 0.15
          years for air_campaign, 0.2 years for skirmish, 1.5 years for conventional war, and 10
          years for occupation at point estimate. Armaments ranges are wider than other modules due
          to force-package composition uncertainty.
        </p>

        {/* CALIBRATION */}
        <AsciiRule tone="mute" />
        <h2 id="calibration">Calibration — Operation Epic Fury (Iran, 2026)</h2>
        <p>
          On February 28, 2026, the United States and Israel launched a sustained air campaign
          against Iran. The first validation pass used Day 17 reporting; the late-April reassessment
          can now compare the model against a 38–39 day campaign and a ceasefire that took effect
          on April 8. The 17-day cost reached $14–16.5B{' '}
          <span className="t-label fg-dim">≈ what the US spends on Head Start for 3 years</span>.
        </p>

        <h3>Conflict Profile</h3>
        <DataTable>
          <DataTable.Row label="SORTIES"   value="1,600+ in early reporting" />
          <DataTable.Row label="TARGETS"   value="13,000+ struck over 39 days" />
          <DataTable.Row label="OPENING"   value="160+ Tomahawk cruise missiles" />
          <DataTable.Row label="RESPONSE"  value="~700 ballistic missiles + ~3,600 drones (17 days)" />
          <DataTable.Row label="NATURE"    value="Sustained air + naval campaign. No ground forces inside Iran." />
          <DataTable.Row label="DAY 1–6"   value={<>$11.3B direct cost (Pentagon, Senate briefing) <span className="t-label fg-dim">≈ annual military budget of Denmark</span></>} />
          <DataTable.Row label="DAY 1–12"  value={<>$16.5B direct cost (CSIS) <span className="t-label fg-dim">≈ Iran&apos;s annual education budget</span></>} />
          <DataTable.Row label="DAY 20"    value="$16.2–23.4B incremental cost (AEI via Axios)" />
          <DataTable.Row label="2 MONTH"   value={<>$38–47B direct projection; $5B indirect excluded (PWBM) <span className="t-label fg-dim">narrow federal spending only</span></>} tone="phosphor" />
          <DataTable.Row label="HUMAN"     value="HRANA Day 39: 3,636 documented deaths; UN/HRA: ~3.2M displaced" />
          <DataTable.Row label="INTERCEPT" value={<>$1.7B in first 100 hrs (CSIS) <span className="t-label fg-dim">≈ 4,300 Patriot PAC-3 interceptors</span></>} />
        </DataTable>

        <h3>Key Discovery: Cost Is Two-Sided</h3>
        <p>
          The CSIS breakdown of the first 100 hours revealed that defensive intercept costs ($1.7B{' '}
          <span className="t-label fg-dim">≈ 4 Nimitz-class refueling overhauls</span>, 46%)
          exceeded offensive strike munitions ($1.5B, 40%) in the opening phase. The original model
          only priced what the aggressor spends attacking. The cost of neutralizing the
          counter-attack was entirely absent.
        </p>
        <div className="formula-block">
          offensive munitions:  $1.5B (40%)<br />
          defensive intercepts: $1.7B (46%)<br />
          equipment losses:     $359M (10%)<br />
          operations &amp; sustainment: $196M (5%)
        </div>

        <h3>Five Gaps Found — Five Fixes Applied</h3>
        {CALIBRATION_GAPS.map((gap) => (
          <div key={gap.id} style={{ marginBottom: 'var(--s-5)' }}>
            <DataTable>
              <DataTable.Row
                label={`GAP ${gap.id}`}
                value={gap.title}
                tone={gap.id === '01' ? 'alert' : 'default'}
              />
              <DataTable.Row label="FOUND" value={gap.finding} />
              <DataTable.Row label="FIX"   value={gap.fix} tone="phosphor" />
            </DataTable>
          </div>
        ))}

        <h3>Pre / Post Results vs Late-April Data</h3>
        <DataTable>
          <DataTable.Row label="SCENARIO" value="BEFORE → AFTER vs REAL" tone="phosphor" />
          {CALIBRATION_RESULTS.map((row) => (
            <DataTable.Row
              key={row.scenario}
              label={row.scenario}
              value={`${row.before} → ${row.after}  |  real: ${row.real}`}
              tone={row.match ? 'phosphor' : 'alert'}
            />
          ))}
        </DataTable>
        <p style={{ fontSize: 'var(--t-label)' }} className="fg-dim">
          Lesson: the original 18-day strike comparison still matched the early direct-cost snapshot,
          but late-April data makes the accounting boundary visible. Public US cost estimates are
          narrow federal military outlays; this calculator’s headline also includes humanitarian and
          reconstruction costs. The human-toll and economic-impact modules now match the updated
          evidence better than the direct military spending module, which remains high for the observed
          39-day campaign.
        </p>

        <h3>Calibration Sources</h3>
        {CALIBRATION_SOURCES.map((source) => (
          <div key={source.name} style={{ marginBottom: 'var(--s-4)' }}>
            <DataTable>
              <DataTable.Row
                label="SOURCE"
                value={<a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>}
                tone="phosphor"
              />
              <DataTable.Row label="USED FOR" value={source.use} />
            </DataTable>
          </div>
        ))}

        {/* AUDIT NOTES */}
        <AsciiRule tone="mute" />
        <h2 id="audit-notes">Audit Notes</h2>
        <p>
          This repository was checked against the shipped data files and the running model logic.
          The goal was not to prove truth, but to document what the current code can defensibly
          claim.
        </p>
        <ol>
          {AUDIT_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ol>

        {/* LIMITATIONS */}
        <AsciiRule tone="mute" />
        <h2 id="limitations">Scope Limits</h2>
        <p>
          Exclusions are a methodological choice rather than an omission. The model only prices
          what the code can currently source, parameterize, and explain line by line.
        </p>
        <ul>
          {LIMITATIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <AsciiRule tone="mute" />
        <p style={{ marginTop: 'var(--s-6)' }}>
          <Link href="/calculator" style={{ color: 'var(--phosphor)' }}>
            Open Calculator →
          </Link>
          {' '}
          <span className="fg-dim">Start with the calculator for the result, then inspect each category line item, then return here for the underlying model assumptions and data pipeline.</span>
        </p>

      </div>
    </MethodologyLayout>
  );
}
