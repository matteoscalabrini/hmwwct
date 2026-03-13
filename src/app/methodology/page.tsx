import Link from 'next/link';

export const metadata = {
  title: 'Methodology | How Much Would a War Cost There?',
  description: 'Research-style documentation of the calculator: data pipeline, public APIs, mathematical models, uncertainty treatment, and audit notes.',
};

const INTERNAL_ROUTES = [
  {
    route: '/api/countries',
    purpose: 'Builds the selectable country list from REST Countries and appends curated records for Taiwan and Kosovo.',
    output: '194 selectable country records with coordinates, flags, region tags, and population baselines.',
  },
  {
    route: '/api/calculate',
    purpose: 'Main orchestration endpoint. Fetches live indicators, merges fallbacks, resolves sanctions, commodity, Comtrade, and ACLED data, then runs every model module.',
    output: 'Cost ranges, line-item assumptions, data freshness labels, ACLED fragility overlays, human displacement estimate, and best-case revenue counterfactual.',
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
    fallback: 'Taiwan and Kosovo are injected from a local curated dataset because the UN-member filter excludes them.',
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
    name: 'SIPRI Military Expenditure Database',
    count: '84 countries',
    note: 'Static military expenditure and personnel benchmark dataset, used as the first offline fallback for defense budgets and force size.',
  },
  {
    name: 'UNHCR-derived displacement ratios',
    count: '25 country cases + 8 regional defaults',
    note: 'Pre-processed IDP and refugee ratios used by the humanitarian model when estimating conflict displacement.',
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
    count: '13 countries',
    note: 'Last-resort GDP, population, military, and trade values for data-sparse states such as North Korea, Syria, and Taiwan.',
  },
  {
    name: 'Opportunity cost dataset',
    count: '10 unit-cost benchmarks',
    note: 'Schools, hospital beds, nurses, vaccines, meals, food support, water access, sanitation access, solar home systems, and restoration costs shown separately from the war total.',
  },
  {
    name: 'Curated extra-country file',
    count: '2 records',
    note: 'Taiwan and Kosovo metadata added on top of the REST Countries feed.',
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
    id: '01',
    title: 'Military Cost Model',
    body:
      'The military module is anchored to direct operational spending benchmarks from Watson Institute case studies and then scaled by aggressor budget, scenario class, distance, and attrition. It does not attempt to reproduce veterans care, interest on war debt, or homeland-security spillovers.',
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
    id: '02',
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
    id: '03',
    title: 'Humanitarian Displacement Model',
    body:
      'The humanitarian module estimates displacement rather than casualties. It applies country-specific or regional UNHCR ratios, dampens skirmish exposure for large countries using land area, and prices support and emergency healthcare per displaced person-year.',
    equations: [
      'displacementRatio = idpRatio + refugeeRatio',
      'populationAtRisk = skirmish && area > 100000 ? population x sqrt(100000 / area) : population',
      'baseDisplaced = populationAtRisk x displacementRatio x scenarioDisplacementMultiplier',
      'displaced = round(baseDisplaced x fragilityMultiplier)',
      'displacementDuration = durationYears + min(durationYears x 1.5, 2)',
      'humanitarianTotal = displaced x (1200 + 300) x displacementDuration',
    ],
    notes:
      'The module then splits displaced people into IDPs and cross-border refugees according to the observed UNHCR ratio mix. ACLED can modestly scale displacement when recent target-country violence is already elevated. Human toll is displayed separately and is not monetized through a value-of-life assumption.',
  },
  {
    id: '04',
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
    id: '05',
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
  {
    id: '06',
    title: 'Aggregation and Uncertainty',
    body:
      'The app does not run a Monte Carlo engine. Instead, each module defines its own conservative range. Headline cost and economic impact are aggregated separately, which keeps the accounting explicit and avoids folding macroeconomic spillovers into the top-line war bill.',
    equations: [
      'headlinePoint = military + humanitarian + reconstruction',
      'headlineMin = militaryMin + humanitarianMin + reconstructionMin',
      'headlineMax = militaryMax + humanitarianMax + reconstructionMax',
      'economicImpactPoint = economic',
    ],
    notes:
      'Scenario durations are normalized archetypes rather than event-specific backtests: 0.2 years for skirmish, 1.5 years for conventional war, and 10 years for occupation at the point estimate.',
  },
];

const AUDIT_NOTES = [
  'Import-time JSON validation is enforced in validated.ts for bilateral trade pairs and commodity producer datasets, including schema shape, ISO alpha-3 keys, numeric bounds, and duplicate-pair normalization.',
  'The repository currently ships 75 bilateral trade pairs, 25 country displacement cases, 8 regional displacement defaults, 84 SIPRI entries, 13 static fallback countries, 8 sanctions regimes, and 32 commodity shock records.',
  'World Bank retrieval now requests the 10 most recent observations so the app can use the latest non-null value instead of defaulting to a fallback too early.',
  'The old methodology-page validation table has been removed. The current calculator uses archetypal scenario durations, so claiming historical event-level tolerance bands without reparameterizing duration and context would overstate precision.',
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
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  summary,
  accentColor = 'var(--accent-blue)',
}: {
  title: string;
  summary: string;
  accentColor?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="classification-label" style={{ color: accentColor }}>
          {title}
        </div>
      </div>
      <p className="max-w-3xl text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
        {summary}
      </p>
    </div>
  );
}

function EquationPanel({ lines }: { lines: string[] }) {
  return (
    <div className="terminal-panel-muted space-y-1.5 p-4 font-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>
      {lines.map((line) => (
        <p key={line} className="leading-7">
          {line}
        </p>
      ))}
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="terminal-stat px-5 py-4 text-center">
      <p className="font-display text-4xl leading-none tracking-[0.08em]" style={{ color: 'var(--accent-blue)' }}>
        {value}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MethodologyPage() {
  return (
    <div className="grid-bg">
      <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-14 sm:px-6 lg:px-8 lg:py-14">
      <header className="space-y-8">
        <div className="space-y-3">
          <p className="terminal-kicker" style={{ color: 'var(--accent-blue)' }}>
            Technical Documentation
          </p>
          <h1 className="font-display text-6xl leading-none tracking-[0.08em]" style={{ color: 'var(--text)' }}>
            Methodology
          </h1>
          <p className="max-w-3xl text-base leading-8" style={{ color: 'var(--text-secondary)' }}>
            This page documents the implemented calculator, not an aspirational model. It describes the public APIs,
            static datasets, mathematical transformations, fallback rules, uncertainty treatment, and audit notes that
            currently drive the application.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 max-w-lg">
          <StatBadge value="6" label="Live APIs" />
          <StatBadge value="8" label="Static Datasets" />
          <StatBadge value="4" label="Cost Modules" />
        </div>
      </header>

      <section className="space-y-6">
        <SectionHeader
          title="Abstract"
          summary="The application estimates the cost of interstate conflict by merging live macroeconomic indicators with curated static conflict datasets, then evaluating a fixed scenario archetype through three headline cost modules plus a separate economic-impact module."
        />
        <div
          className="terminal-panel grid gap-0 overflow-hidden lg:grid-cols-[1.3fr_0.7fr]"
        >
          <div className="space-y-4 p-6 text-sm leading-7 sm:p-8" style={{ color: 'var(--text-secondary)' }}>
            <p>
              The system treats war-cost estimation as a transparent accounting exercise. Every user-facing number must
              either come from a named public source or from a deterministic transformation applied to those sources.
              When live APIs fail or provide no coverage, the code falls back to explicit local datasets rather than
              silently imputing values.
            </p>
            <p>
              The calculator is intentionally conservative in scope. It prices military operations, economic
              dislocation, humanitarian displacement support, and reconstruction. It does not claim to price the full
              social cost of war, and it explicitly excludes nuclear escalation, long-run trauma, ecological damage,
              alliance cascades, and other second-order effects that are either methodologically unstable or not yet
              parameterized in code.
            </p>
          </div>
          <div
            className="flex flex-col justify-center space-y-4 border-l p-6 sm:p-8"
            style={{ borderColor: 'var(--border)', background: 'rgba(18, 33, 27, 0.58)' }}
          >
            <p className="terminal-kicker">
              Core Principle
            </p>
            <EquationPanel
              lines={[
                'headlineCost = military + humanitarian + reconstruction',
                'economicImpact is reported separately from headlineCost',
                'netPosition = revenue - headlineCost',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="System Design"
          summary="The codebase is organized as a small Next.js application: static pages at the top, server routes in the middle, and deterministic calculation modules beneath them."
          accentColor="var(--accent-indigo)"
        />
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div
            className="terminal-panel overflow-hidden"
          >
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="terminal-kicker" style={{ color: 'var(--accent-indigo)' }}>
                Internal Routes
              </p>
            </div>
            {INTERNAL_ROUTES.map((item, index) => (
              <div
                key={item.route}
                className="px-6 py-5 space-y-2"
                style={{ borderBottom: index < INTERNAL_ROUTES.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                  {item.route}
                </p>
                <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  {item.purpose}
                </p>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                  Output: {item.output}
                </p>
              </div>
            ))}
          </div>
          <div
            className="terminal-panel space-y-5 p-6 sm:p-8"
          >
            <p className="terminal-kicker" style={{ color: 'var(--accent-indigo)' }}>
              Country Assembly Pipeline
            </p>
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              The calculation route starts by building two enriched country objects. Geographic metadata comes from REST
              Countries, live indicators come from World Bank, GDP can fall back to IMF DataMapper, military and
              sanctions context can fall back to local datasets, and missing data-sparse states are explicitly labeled
              through the <span className="font-mono text-xs" style={{ color: 'var(--accent-cyan)' }}>hasStaticFallback</span> flag.
            </p>
            <EquationPanel lines={COUNTRY_ASSEMBLY_LINES} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Data Sources"
          summary="The calculator mixes live public APIs with versioned local datasets. Live APIs are used for recency; local files are used for coverage, calibration, and transparent fallback behavior."
          accentColor="var(--accent-emerald)"
        />

        <div
          className="terminal-panel overflow-hidden"
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="terminal-kicker" style={{ color: 'var(--accent-emerald)' }}>
              Live APIs
            </p>
          </div>
          {LIVE_APIS.map((api, index) => (
            <div
              key={api.name}
              className="px-6 py-5 grid gap-4 lg:grid-cols-[1fr_1.2fr_auto]"
              style={{ borderBottom: index < LIVE_APIS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="space-y-1.5">
                <a
                  href={api.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:underline transition-colors"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  {api.name}
                </a>
                <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {api.variables}
                </p>
              </div>
              <div className="space-y-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                <p>{api.role}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {api.fallback}
                </p>
              </div>
              <div className="flex items-start">
                <span
                  className="rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap"
                  style={{ background: 'rgba(18, 33, 27, 0.6)', color: 'var(--text-muted)', borderColor: 'var(--border-bright)' }}
                >
                  Cache: {api.cache}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="terminal-panel overflow-hidden"
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="terminal-kicker" style={{ color: 'var(--accent-emerald)' }}>
              Static Datasets and Fallback Layers
            </p>
          </div>
          <div className="grid md:grid-cols-2">
            {STATIC_DATASETS.map((dataset, index) => (
              <div
                key={dataset.name}
                className="px-6 py-5 space-y-2"
                style={{
                  borderBottom: index < STATIC_DATASETS.length - 1 ? '1px solid var(--border)' : 'none',
                  borderRight: index % 2 === 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {dataset.name}
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--accent-emerald)' }}>
                  {dataset.count}
                </p>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                  {dataset.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="API Endpoints"
          summary="These are the actual upstream endpoint patterns the code calls today. The app wraps them with cache control, graceful fallback, and input normalization before they influence any result."
          accentColor="var(--accent-blue)"
        />
        <div className="terminal-panel overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="terminal-kicker" style={{ color: 'var(--accent-blue)' }}>
              External Endpoint Map
            </p>
          </div>
          {API_ENDPOINTS.map((item, index) => (
            <div
              key={item.name}
              className="grid gap-3 px-6 py-5 lg:grid-cols-[0.75fr_1.4fr_1fr]"
              style={{ borderBottom: index < API_ENDPOINTS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text)' }}>
                {item.name}
              </p>
              <p className="font-mono text-xs leading-6" style={{ color: 'var(--accent-cyan)' }}>
                {item.endpoint}
              </p>
              <p className="text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
                {item.use}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Added Calculations"
          summary="Recent live-data refinements do not replace the base model. They sit on top of the prior architecture to improve trade realism, inflation handling, commodity scaling, and target-country fragility sensitivity."
          accentColor="var(--accent-cyan)"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {ADDED_CALCULATIONS.map((item) => (
            <div key={item.title} className="terminal-panel space-y-4 p-6">
              <div className="space-y-2">
                <p className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
                  {item.title}
                </p>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                  {item.note}
                </p>
              </div>
              <EquationPanel lines={item.lines} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Model Specification"
          summary="Every category shown in the UI maps to a dedicated TypeScript module. The equations below are reduced forms of the implemented code, using the same constants and branching logic."
          accentColor="var(--accent-amber)"
        />
        <div className="space-y-6">
          {MODEL_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="terminal-panel grid gap-0 overflow-hidden lg:grid-cols-[1fr_1.2fr]"
            >
              <div className="p-6 sm:p-8 space-y-4" style={{ borderRight: '1px solid var(--border)' }}>
                <h3 className="text-lg font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text)' }}>
                  {section.title}
                </h3>
                <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  {section.body}
                </p>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                  {section.notes}
                </p>
              </div>
              <div className="p-6 sm:p-8 flex items-center">
                <EquationPanel lines={section.equations} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Calibration and Audit Notes"
          summary="This repository was checked against the shipped data files and the running model logic. The goal was not to prove truth, but to document what the current code can defensibly claim."
          accentColor="var(--accent-cyan)"
        />
        <div
          className="terminal-panel space-y-5 p-6 sm:p-8"
        >
          {AUDIT_NOTES.map((note, index) => (
            <div key={note} className="flex gap-4 items-start">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                style={{ background: 'rgba(18, 33, 27, 0.68)', color: 'var(--accent-cyan)', borderColor: 'var(--border-bright)' }}
              >
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Scope Limits"
          summary="Exclusions are a methodological choice rather than an omission. The model only prices what the code can currently source, parameterize, and explain line by line."
          accentColor="var(--accent-red)"
        />
        <div
          className="terminal-panel grid gap-4 p-6 sm:p-8 md:grid-cols-2"
        >
          {LIMITATIONS.map((item) => (
            <div key={item} className="flex gap-3 items-start">
              <span
                className="flex-shrink-0 mt-0.5 text-sm font-bold"
                style={{ color: 'var(--accent-red)' }}
              >
                ✕
              </span>
              <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="terminal-panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="space-y-2">
          <p className="font-display text-4xl leading-none tracking-[0.08em]" style={{ color: 'var(--text)' }}>
            Ready to run the numbers?
          </p>
          <p className="max-w-xl text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
            Start with the calculator for the result, then inspect each category line item, then return here for the
            underlying model assumptions and data pipeline.
          </p>
        </div>
        <Link
          href="/calculator"
          className="terminal-button terminal-button-primary whitespace-nowrap"
        >
          Open Calculator
        </Link>
      </section>
      </div>
    </div>
  );
}
