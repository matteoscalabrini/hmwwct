import Link from 'next/link';

export const metadata = {
  title: 'Methodology | How Much Would a War Cost There?',
  description: 'Full explanation of how war cost estimates are calculated, including all formulas, assumptions, and data sources.',
};

const SOURCES = [
  {
    name: 'WORLD BANK WORLD DEVELOPMENT INDICATORS',
    url: 'https://data.worldbank.org/indicator/',
    tag: 'LIVE API',
    desc: 'GDP (NY.GDP.MKTP.CD), military % of GDP (MS.MIL.XPND.GD.ZS), population (SP.POP.TOTL), trade % of GDP. No API key. Cached daily.',
  },
  {
    name: 'SIPRI MILITARY EXPENDITURE DATABASE',
    url: 'https://www.sipri.org/databases/milex',
    tag: 'STATIC · CC BY-NC',
    desc: 'Military expenditure in constant USD and personnel counts for 80+ countries. Primary source for military budgets.',
  },
  {
    name: 'WATSON INSTITUTE "COSTS OF WAR" — BROWN UNIVERSITY',
    url: 'https://watson.brown.edu/costsofwar/',
    tag: 'STATIC · CALIBRATION',
    desc: 'Historical benchmarks: Afghanistan $2.313T (2001–2021), Iraq $2.058T (2003–2011). Used to validate multipliers.',
  },
  {
    name: 'UNHCR POPULATION STATISTICS',
    url: 'https://www.unhcr.org/refugee-statistics/',
    tag: 'STATIC · PRE-PROCESSED',
    desc: 'Displacement ratios (IDP + refugees / pre-conflict population) for 25 country-specific cases and 8 regional defaults.',
  },
  {
    name: 'UN COMTRADE DATABASE',
    url: 'https://comtradeplus.un.org/',
    tag: 'STATIC · 2022',
    desc: 'Top 200 bilateral trade volumes (goods). Gravity model fallback for unlisted pairs.',
  },
  {
    name: 'IEA OIL MARKET REPORT / USGS MINERAL COMMODITY SUMMARIES',
    url: 'https://www.iea.org/reports/oil-market-report-december-2023',
    tag: 'STATIC',
    desc: 'Major commodity producer data (oil, gas, wheat, semiconductors, lithium) and global GDP shock estimates.',
  },
  {
    name: 'WHO / UNICEF / WORLD BANK — OPPORTUNITY COSTS',
    url: 'https://www.who.int/emergencies/funding',
    tag: 'STATIC · CONTEXT ONLY',
    desc: 'Unit costs for schools, hospital beds, vaccines, clean water. Used for opportunity cost widget only — NOT in total.',
  },
  {
    name: 'REST COUNTRIES API',
    url: 'https://restcountries.com/',
    tag: 'LIVE API',
    desc: 'Country metadata: names, flags, coordinates, region, area. Cached weekly.',
  },
  {
    name: 'CIA WORLD FACTBOOK / IMF ARTICLE IV (STATIC FALLBACK)',
    url: 'https://www.cia.gov/the-world-factbook/',
    tag: 'STATIC FALLBACK',
    desc: 'For ~13 data-sparse countries (PRK, SYR, YEM, AFG, SOM, SDN, LBY, ERI, TKM, MMR, CUB, VEN, TWN). Always labeled.',
  },
];

const EXCLUSIONS = [
  'NUCLEAR OR WMD ESCALATION',
  'CYBER WARFARE COSTS',
  'LONG-TERM ENVIRONMENTAL DAMAGE (DEPLETED URANIUM, LANDMINES, SOIL CONTAMINATION)',
  'SECOND AND THIRD-ORDER GEOPOLITICAL REALIGNMENTS AND ALLIANCE SHIFTS',
  'DISEASE AND PANDEMIC RISK FROM CONFLICT-INDUCED DISPLACEMENT',
  'ALLIANCE ACTIVATION COSTS (NATO ARTICLE 5, MUTUAL DEFENSE TREATIES)',
  'BRAIN DRAIN AND LONG-TERM HUMAN CAPITAL LOSS',
  'PSYCHOLOGICAL TRAUMA COSTS AT POPULATION SCALE',
  'COSTS TO NEUTRAL THIRD-PARTY NATIONS BEYOND COMMODITY PRICE SHOCKS',
  'SHADOW ECONOMY DISRUPTION IN ALREADY-SANCTIONED NATIONS',
];

const VALIDATION = [
  ['KARGIL WAR (1999)', 'SKIRMISH', '~$7B (BOTH SIDES, 2023 USD)', 'WITHIN ±50%', 'WITHIN RANGE'],
  ['GULF WAR (1991)', 'CONVENTIONAL', '~$250B (2023 USD)', 'WITHIN ±40%', 'WITHIN RANGE'],
  ['AFGHANISTAN (2001–2021)', 'OCCUPATION', '$2.313T (WATSON INSTITUTE)', 'WITHIN ±35%', 'WITHIN RANGE'],
];

export default function MethodologyPage() {
  return (
    <div className="px-4 sm:px-10 py-10 space-y-0">

      {/* Header */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-8 sm:p-12 space-y-4">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
          WOPR // DOCUMENTATION // DECLASSIFIED
        </p>
        <h1
          className="font-workbench glow"
          style={{ color: 'var(--green)', fontSize: 'clamp(2rem, 4vw, 4rem)', lineHeight: 1.05 }}
        >
          METHODOLOGY
        </h1>
        <div style={{ borderLeft: '3px solid var(--green-dim)', paddingLeft: '1.25rem' }} className="space-y-1">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--green-dim)' }}>
            EVERY FORMULA. EVERY COEFFICIENT. EVERY ASSUMPTION. FULLY DOCUMENTED.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            If you find an error, the system wants to know.
            These numbers matter — getting them right matters more.
          </p>
        </div>
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// CORE PHILOSOPHY ///
        </p>
      </div>

      {/* Philosophy */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ border: '1px solid var(--border)' }}
      >
        {[
          {
            label: 'NO FABRICATED DATA',
            body: 'Every number is sourced from a real, publicly accessible dataset or official publication. Where APIs return null (North Korea, Syria), we use clearly labeled static fallback values — never invented figures.',
          },
          {
            label: 'UNCERTAINTY IS EXPLICIT',
            body: 'Every estimate is shown as a range (min–max) alongside a point estimate. War costs are notoriously hard to predict. These are illustrative ranges, not forecasts. The real number is usually higher.',
          },
          {
            label: 'CASUALTIES NOT MONETIZED',
            body: 'We do not apply a Value of Statistical Life (VSL) to casualties. The methodological controversy (VSL ranges from $1M–$10M depending on country) makes it inappropriate. Human toll is shown as numbers, not dollars.',
          },
        ].map(({ label, body }, i) => (
          <div
            key={label}
            className="p-6 space-y-3"
            style={{
              background: 'var(--panel)',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}
          >
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>{label}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{body}</p>
          </div>
        ))}
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// DATA SOURCES ///
        </p>
      </div>

      {/* Data sources */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
        {SOURCES.map((s, i) => (
          <div
            key={s.name}
            className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-start"
            style={{ borderBottom: i < SOURCES.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="md:col-span-1">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold tracking-wider uppercase hover:opacity-80 transition-opacity"
                style={{ color: 'var(--green)' }}
              >
                {s.name}
              </a>
              <p className="text-xs mt-1 tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {s.tag}
              </p>
            </div>
            <p className="md:col-span-3 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// CALCULATION FORMULAS ///
        </p>
      </div>

      {/* Formulas */}
      <div style={{ border: '1px solid var(--border)' }} className="space-y-0">

        {/* Military */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }} className="p-6 space-y-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
            01 // MILITARY COST
          </p>
          <div
            className="p-4 text-xs space-y-1.5 leading-relaxed"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--green-dim)' }}
          >
            <p>DAILY_OPERATIONAL  = (aggressor_military_budget / 365) × intensity × 2.5</p>
            <p>LOGISTICS_MULT     = 1 + (distance_km / 1,000) × 0.03  [capped at 2.5×]</p>
            <p>EQUIPMENT_COST     = military_budget × attrition_pct × duration_years</p>
            <p>MILITARY_TOTAL     = (DAILY_OPERATIONAL × days × LOGISTICS_MULT) + EQUIPMENT_COST</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            2.5× wartime surge factor derived from Watson Institute analysis of US Afghanistan/Iraq spending vs. peacetime military budget.
            Intensity multipliers: skirmish 0.4×, conventional 1.0×, occupation 1.6×.
            Logistics multiplier per RAND Corporation studies — each 1,000 km adds ~3% overhead, capped at 2.5× for transoceanic deployments.
          </p>
        </div>

        {/* Economic */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }} className="p-6 space-y-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
            02 // ECONOMIC IMPACT
          </p>
          <div
            className="p-4 text-xs space-y-1.5 leading-relaxed"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--green-dim)' }}
          >
            <p>TRADE_LOSS         = bilateral_trade_volume × 0.70 × duration_years</p>
            <p>TARGET_GDP_LOSS    = target_gdp × gdp_impact_pct × duration_years</p>
            <p>COMMODITY_SHOCK    = [applied if target is major global producer]</p>
            <p>ECONOMIC_TOTAL     = TRADE_LOSS + TARGET_GDP_LOSS + [COMMODITY_SHOCK]</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            70% trade disruption: WTO research on conflict and trade flows (Martin et al., 2008).
            GDP impact rates by scenario: target 3–40%/year (World Bank conflict database).
            Aggressor GDP loss omitted — historical data shows aggressor economies often grow during short wars (US GDP grew during Afghanistan).
            Commodity shock applied only when target is a major global producer per IEA/USGS data.
          </p>
        </div>

        {/* Humanitarian */}
        <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }} className="p-6 space-y-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
            03 // HUMANITARIAN COST
          </p>
          <div
            className="p-4 text-xs space-y-1.5 leading-relaxed"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--green-dim)' }}
          >
            <p>DISPLACED          = target_population × (idp_ratio + refugee_ratio) × scenario_mult</p>
            <p>COST_PER_PERSON_YR = $1,200 (UNHCR) + $300 (WHO medical)</p>
            <p>DISPLACEMENT_DUR   = conflict_years + min(conflict_years × 1.5, 2)</p>
            <p>HUMANITARIAN_TOTAL = DISPLACED × COST_PER_PERSON_YR × DISPLACEMENT_DUR</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Displacement ratios from UNHCR POPSTATS for 25 country-specific cases and 8 regional defaults.
            UNHCR average cost: $1,200/person/year (Global Trends 2023). WHO emergency health: $300/person/year.
            Displacement persists beyond conflict end on average (UNHCR return data).
            Scenario multipliers: skirmish 0.05×, conventional 0.5×, occupation 0.7×.
            CASUALTIES ARE SHOWN AS HUMAN NUMBERS ONLY — NOT MONETIZED.
          </p>
        </div>

        {/* Reconstruction */}
        <div style={{ background: 'var(--panel)' }} className="p-6 space-y-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
            04 // RECONSTRUCTION
          </p>
          <div
            className="p-4 text-xs space-y-1.5 leading-relaxed"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--green-dim)' }}
          >
            <p>RECONSTRUCTION     = target_gdp × annual_rate × duration_years</p>
            <p>SKIRMISH:            1%/yr of target GDP</p>
            <p>CONVENTIONAL:       20%/yr of target GDP</p>
            <p>OCCUPATION:         30%/yr of target GDP</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Rates from World Bank post-conflict reconstruction studies and historical actuals:
            Afghanistan reconstruction ~$145B (USAID, 2002–2021), Iraq ~$60B committed.
            Iraq GDP at invasion: ~$70B (30% rate = $21B; actual closer to 85%+ due to infrastructure destruction).
            These cases inform the scenario range bounds.
          </p>
        </div>
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// VALIDATION AGAINST HISTORICAL CONFLICTS ///
        </p>
      </div>

      {/* Validation table */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CONFLICT', 'SCENARIO', 'PUBLISHED ESTIMATE', 'TARGET TOLERANCE', 'STATUS'].map((h) => (
                <th key={h} className="p-4 text-left tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VALIDATION.map(([conflict, scenario, published, tolerance, status], i) => (
              <tr
                key={conflict}
                style={{ borderBottom: i < VALIDATION.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td className="p-4 font-bold" style={{ color: 'var(--green)' }}>{conflict}</td>
                <td className="p-4" style={{ color: 'var(--text-dim)' }}>{scenario}</td>
                <td className="p-4" style={{ color: 'var(--text-dim)' }}>{published}</td>
                <td className="p-4" style={{ color: 'var(--text-muted)' }}>{tolerance}</td>
                <td className="p-4 font-bold" style={{ color: 'var(--green)' }}>{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// DOCUMENTED EXCLUSIONS — NOT OVERSIGHTS ///
        </p>
      </div>

      {/* Exclusions */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXCLUSIONS.map((item) => (
            <div key={item} className="flex gap-3 items-start">
              <span className="shrink-0 text-xs font-bold mt-0.5" style={{ color: 'var(--red)' }}>✕</span>
              <p className="text-xs tracking-wide" style={{ color: 'var(--text-dim)' }}>{item}</p>
            </div>
          ))}
        </div>
        <p className="text-xs pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          EACH EXCLUDED DUE TO DATA UNAVAILABILITY, METHODOLOGICAL CONTROVERSY, OR SCOPE CONSTRAINTS.
          THE LIST DOES NOT MAKE THE NUMBERS SMALLER — IT MAKES THEM MORE DEFENSIBLE.
        </p>
      </div>

      {/* CTA */}
      <div className="py-6">
        <Link
          href="/calculator"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}
          className="inline-flex items-center px-10 py-4 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
        >
          &gt; INITIATE ANALYSIS
        </Link>
      </div>

    </div>
  );
}
