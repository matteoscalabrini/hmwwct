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
    purpose: 'Main orchestration endpoint. Fetches live indicators, merges fallbacks, resolves sanctions and commodity data, then runs every model module.',
    output: 'Cost ranges, line-item assumptions, data freshness labels, human displacement estimate, and best-case revenue counterfactual.',
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
      'tradeVolume = lookupPair(a, b) ?? 0.004 x sqrt(GDP_a x GDP_b) / max(distanceKm, 500)',
      'tradeLoss = tradeVolume x 0.70 x durationYears x 0.50',
      'targetGDPLoss = targetGDP x (1 - (1 - targetGDPImpactPct)^durationYears)',
      'capitalFlight = targetGDP x capitalFlightPct x min(durationYears, 2)',
      'sanctions = aggressorGDP x additionalWarSanctionsPct x durationYears',
      'commodityShock = sum_i(shock_i x livePriceScalar_i x sqrt(max(durationYears, 1)))',
    ],
    notes:
      'Oil, gas, and wheat shocks can scale with live FRED prices; semiconductors and lithium are treated as structural supply-chain shocks and are not price-scaled.',
  },
  {
    id: '03',
    title: 'Humanitarian Displacement Model',
    body:
      'The humanitarian module estimates displacement rather than casualties. It applies country-specific or regional UNHCR ratios, dampens skirmish exposure for large countries using land area, and prices support and emergency healthcare per displaced person-year.',
    equations: [
      'displacementRatio = idpRatio + refugeeRatio',
      'populationAtRisk = skirmish && area > 100000 ? population x sqrt(100000 / area) : population',
      'displaced = round(populationAtRisk x displacementRatio x scenarioDisplacementMultiplier)',
      'displacementDuration = durationYears + min(durationYears x 1.5, 2)',
      'humanitarianTotal = displaced x (1200 + 300) x displacementDuration',
    ],
    notes:
      'The module then splits displaced people into IDPs and cross-border refugees according to the observed UNHCR ratio mix. Human toll is displayed separately and is not monetized through a value-of-life assumption.',
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

function SectionHeader({
  index,
  title,
  summary,
}: {
  index: string;
  title: string;
  summary: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--green-dim)' }}>
        Section {index}
      </p>
      <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_1fr] md:items-end">
        <h2 className="text-xl sm:text-2xl font-bold tracking-wide" style={{ color: 'var(--green)' }}>
          {title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {summary}
        </p>
      </div>
    </div>
  );
}

function EquationPanel({ lines }: { lines: string[] }) {
  return (
    <div
      className="p-4 text-xs space-y-2"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--green-dim)' }}
    >
      {lines.map((line) => (
        <p key={line} className="font-mono leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="px-5 py-6 space-y-8">
      <header
        className="p-8 sm:p-12 space-y-5"
        style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
      >
        <p className="text-xs tracking-[0.35em] uppercase" style={{ color: 'var(--text-dim)' }}>
          Working Paper
        </p>
        <div className="space-y-3">
          <h1
            className="font-workbench glow"
            style={{ color: 'var(--green)', fontSize: 'clamp(2rem, 4vw, 4rem)', lineHeight: 1.05 }}
          >
            Methodology
          </h1>
          <p className="max-w-4xl text-sm leading-relaxed" style={{ color: 'var(--green-dim)' }}>
            This page documents the implemented calculator, not an aspirational model. It describes the public APIs,
            static datasets, mathematical transformations, fallback rules, uncertainty treatment, and audit notes that
            currently drive the application.
          </p>
        </div>
        <div
          className="grid gap-4 md:grid-cols-3 text-xs"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', color: 'var(--text-dim)' }}
        >
          <p>4 external live APIs in active use.</p>
          <p>8 local datasets plus validation layers and fallbacks.</p>
          <p>4 cost modules plus a separate revenue counterfactual.</p>
        </div>
      </header>

      <section className="space-y-4">
        <SectionHeader
          index="00"
          title="Abstract"
          summary="The application estimates the cost of interstate conflict by merging live macroeconomic indicators with curated static conflict datasets, then evaluating a fixed scenario archetype through three headline cost modules plus a separate economic-impact module."
        />
        <div
          className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
          style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
        >
          <div className="p-6 space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
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
          <div className="p-6 space-y-3" style={{ borderLeft: '1px solid var(--border)' }}>
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--green-dim)' }}>
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

      <section className="space-y-4">
        <SectionHeader
          index="01"
          title="System Design"
          summary="The codebase is organized as a small Next.js application: static pages at the top, server routes in the middle, and deterministic calculation modules beneath them."
        />
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
            {INTERNAL_ROUTES.map((item, index) => (
              <div
                key={item.route}
                className="p-5 space-y-2"
                style={{ borderBottom: index < INTERNAL_ROUTES.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>
                  {item.route}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  {item.purpose}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Output: {item.output}
                </p>
              </div>
            ))}
          </div>
          <div
            className="p-6 space-y-4"
            style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
          >
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--green-dim)' }}>
              Country Assembly Pipeline
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              The calculation route starts by building two enriched country objects. Geographic metadata comes from REST
              Countries, live indicators come from World Bank, GDP can fall back to IMF DataMapper, military and
              sanctions context can fall back to local datasets, and missing data-sparse states are explicitly labeled
              through the `hasStaticFallback` flag.
            </p>
            <EquationPanel lines={COUNTRY_ASSEMBLY_LINES} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          index="02"
          title="Data Sources"
          summary="The calculator mixes live public APIs with versioned local datasets. Live APIs are used for recency; local files are used for coverage, calibration, and transparent fallback behavior."
        />
        <div className="space-y-4">
          <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-bold tracking-wide" style={{ color: 'var(--green)' }}>
                Live APIs
              </p>
            </div>
            {LIVE_APIS.map((api, index) => (
              <div
                key={api.name}
                className="p-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr_0.8fr]"
                style={{ borderBottom: index < LIVE_APIS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="space-y-1">
                  <a
                    href={api.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold tracking-[0.2em] uppercase hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--green)' }}
                  >
                    {api.name}
                  </a>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Variables: {api.variables}
                  </p>
                </div>
                <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  <p>{api.role}</p>
                  <p style={{ color: 'var(--text-muted)' }}>{api.fallback}</p>
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Cache: {api.cache}
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-bold tracking-wide" style={{ color: 'var(--green)' }}>
                Static Datasets and Fallback Layers
              </p>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              {STATIC_DATASETS.map((dataset, index) => (
                <div
                  key={dataset.name}
                  className="p-5 space-y-2"
                  style={{
                    borderBottom: index < STATIC_DATASETS.length - 2 ? '1px solid var(--border)' : 'none',
                    borderRight: index % 2 === 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--green)' }}>
                    {dataset.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--green-dim)' }}>
                    {dataset.count}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    {dataset.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          index="03"
          title="Model Specification"
          summary="Every category shown in the UI maps to a dedicated TypeScript module. The equations below are reduced forms of the implemented code, using the same constants and branching logic."
        />
        <div className="space-y-4">
          {MODEL_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]"
              style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
            >
              <div className="p-6 space-y-3" style={{ borderRight: '1px solid var(--border)' }}>
                <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--green-dim)' }}>
                  Model {section.id}
                </p>
                <h3 className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                  {section.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  {section.body}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {section.notes}
                </p>
              </div>
              <div className="p-6">
                <EquationPanel lines={section.equations} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          index="04"
          title="Calibration and Audit Notes"
          summary="This repository was checked against the shipped data files and the running model logic. The goal was not to prove truth, but to document what the current code can defensibly claim."
        />
        <div
          className="p-6 space-y-4"
          style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
        >
          {AUDIT_NOTES.map((note, index) => (
            <div key={note} className="flex gap-3 items-start">
              <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>
                [{String(index + 1).padStart(2, '0')}]
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          index="05"
          title="Scope Limits"
          summary="Exclusions are a methodological choice rather than an omission. The model only prices what the code can currently source, parameterize, and explain line by line."
        />
        <div
          className="grid gap-3 md:grid-cols-2"
          style={{ border: '1px solid var(--border)', background: 'var(--panel)', padding: '1.5rem' }}
        >
          {LIMITATIONS.map((item) => (
            <div key={item} className="flex gap-3 items-start">
              <span className="text-xs font-bold mt-0.5" style={{ color: 'var(--red)' }}>
                x
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
      >
        <div className="space-y-1">
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--green-dim)' }}>
            Recommended Reading Order
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Start with the calculator for the result, then inspect each category line item, then return here for the
            underlying model assumptions and data pipeline.
          </p>
        </div>
        <Link
          href="/calculator"
          className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}
        >
          Open Calculator
        </Link>
      </section>
    </div>
  );
}
