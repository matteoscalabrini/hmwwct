import Link from 'next/link';

const INTEL = [
  { label: 'GLOBAL DEFENSE SPEND', value: '$2,443B', sub: 'SIPRI 2024 · +7.4% YOY' },
  { label: 'UN PEACEKEEPING BUDGET', value: '$6.5B', sub: '0.27% of military spend' },
  { label: 'ACTIVE ARMED CONFLICTS', value: '56', sub: 'ACLED 2024 · post-cold war high' },
  { label: 'U.S. POST-9/11 WAR COSTS', value: '$8T+', sub: 'Watson Institute est.' },
  { label: 'DISPLACED PERSONS', value: '117M', sub: 'UNHCR 2024 · all-time high' },
];

const BOOT_LOG = [
  { tag: 'SYS ', text: 'INITIALIZING WOPR SUBSYSTEMS...' },
  { tag: 'OK  ', text: 'WORLD BANK API: CONNECTED' },
  { tag: 'OK  ', text: 'SIPRI MILITARY DATABASE: 2024 RELEASE LOADED' },
  { tag: 'OK  ', text: 'UNHCR DISPLACEMENT RATIOS: CURRENT' },
  { tag: 'WARN', text: '56 ACTIVE CONFLICTS DETECTED IN OPERATIONAL DATASET' },
  { tag: 'OK  ', text: 'WATSON INSTITUTE COST MODEL: CALIBRATED' },
  { tag: 'OK  ', text: 'CALCULATION ENGINE: READY' },
  { tag: 'SYS ', text: 'AWAITING INPUT.' },
];

const TAG_COLOR: Record<string, string> = {
  'SYS ': 'var(--text-dim)',
  'OK  ': 'var(--green)',
  'WARN': 'var(--amber)',
};

export default function Home() {
  return (
    <div className="px-4 sm:px-10 py-10 space-y-0">

      {/* HERO */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-8 sm:p-14 space-y-8">

        {/* Boot log */}
        <div className="space-y-0.5 text-xs">
          {BOOT_LOG.map((line, i) => (
            <p key={i} className={i === BOOT_LOG.length - 1 ? 'cursor' : ''}>
              <span style={{ color: TAG_COLOR[line.tag] ?? 'var(--text-dim)' }}>
                [{line.tag}]&nbsp;
              </span>
              <span style={{ color: i === BOOT_LOG.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                {line.text}
              </span>
            </p>
          ))}
        </div>

        {/* Title — Workbench, one line */}
        <h1
          className="font-workbench glow"
          style={{ color: 'var(--green)', fontSize: 'clamp(2rem, 5.5vw, 5.5rem)', lineHeight: 1.05, whiteSpace: 'nowrap' }}
        >
          HOW MUCH WOULD A WAR COST THERE?
        </h1>

        {/* Statement */}
        <div className="space-y-1" style={{ borderLeft: '3px solid var(--green-dim)', paddingLeft: '1.25rem' }}>
          <p className="text-lg sm:text-2xl font-bold leading-snug" style={{ color: 'var(--green)' }}>
            SOMEWHERE RIGHT NOW, A DEFENSE MINISTER IS RUNNING THESE EXACT NUMBERS.
          </p>
          <p className="text-sm sm:text-lg font-bold leading-snug" style={{ color: 'var(--green-dim)' }}>
            WE THOUGHT THE PUBLIC SHOULD HAVE ACCESS TOO.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-0 pt-2">
          <Link
            href="/calculator"
            style={{ background: 'var(--green)', color: 'var(--bg)', border: '1px solid var(--green)' }}
            className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            &gt; INITIATE ANALYSIS
          </Link>
          <Link
            href="/methodology"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', marginLeft: '-1px' }}
            className="inline-flex items-center justify-center px-10 py-4 text-sm tracking-widest uppercase hover:text-[var(--green)] hover:border-[var(--green-dim)] transition-colors"
          >
            &gt; READ METHODOLOGY
          </Link>
        </div>
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// LIVE SITUATION FEED /// SIPRI · ACLED · UNHCR · WATSON INSTITUTE · 2024 ///
        </p>
      </div>

      {/* LIVE SITUATION FEED */}
      <div
        className="grid grid-cols-2 md:grid-cols-5"
        style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}
      >
        {INTEL.map((item, i) => (
          <div
            key={item.label}
            className="p-5 space-y-1"
            style={{ borderRight: i < INTEL.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
              {item.label}
            </p>
            <p className="text-3xl font-bold tabular-nums glow" style={{ color: 'var(--green)' }}>
              {item.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ASCII break */}
      <div className="py-2 px-1">
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          /// DECLASSIFIED DATA FEEDS /// ALL SOURCES PUBLIC AND FREELY AVAILABLE ///
        </p>
      </div>

      {/* DATA SOURCES + DISCLAIMER */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ border: '1px solid var(--border)' }}>
        <div className="p-6 space-y-4" style={{ background: 'var(--panel)', borderRight: '1px solid var(--border)' }}>
          <div className="flex flex-wrap gap-2">
            {[
              'World Bank WDI', 'SIPRI (CC BY-NC)', 'UNHCR POPSTATS',
              'IMF DataMapper', 'UN Comtrade', 'Watson Institute',
              'IEA', 'WHO', 'UNICEF', 'USGS', 'REST Countries',
            ].map((source) => (
              <span
                key={source}
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}
                className="px-2 py-1 text-xs tracking-wider uppercase"
              >
                {source}
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            THE ANALYSIS IS THE PART THEY CHARGE FOR. WE DON&apos;T.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--amber)', background: 'rgba(255,176,0,0.03)' }} className="p-6 space-y-3">
          <p className="text-xs font-bold tracking-widest uppercase glow-amber" style={{ color: 'var(--amber)' }}>
            ⚠ NOTICE TO USER
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--amber)', opacity: 0.8 }}>
            FOR EDUCATIONAL AND POLICY ANALYSIS PURPOSES ONLY.
            THE ACTUAL COST IS ALWAYS HIGHER THAN THE PROJECTION USED TO JUSTIFY THE DECISION.
            DOES NOT MODEL NUCLEAR ESCALATION, CYBER WARFARE, OR ALLIANCE COSTS.{' '}
            <Link href="/methodology" className="underline">READ FULL METHODOLOGY.</Link>
          </p>
          <p className="text-xs" style={{ color: 'var(--amber)', opacity: 0.45 }}>
            IF THIS TOOL PREVENTS EVEN ONE SLIDE IN ONE BRIEFING FROM BEING OPTIMISTIC, IT HAS DONE ITS JOB.
          </p>
        </div>
      </div>

    </div>
  );
}
