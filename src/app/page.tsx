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
    <div className="px-5 py-6 flex-1 flex flex-col min-h-0">

      {/* HERO */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="flex-1 flex flex-col p-8 sm:p-12 gap-8 min-h-0">

        {/* Title */}
        <h1
          className="font-workbench glow"
          style={{ color: 'var(--green)', fontSize: 'clamp(2rem, 5vw, 5rem)', lineHeight: 1.05, whiteSpace: 'nowrap' }}
        >
          HOW MUCH WOULD A WAR COST THERE?
        </h1>

        {/* Statement */}
        <div className="space-y-2" style={{ borderLeft: '3px solid var(--green-dim)', paddingLeft: '1.25rem' }}>
          <p className="text-base sm:text-2xl font-bold leading-snug" style={{ color: 'var(--green)' }}>
            SOMEWHERE RIGHT NOW, A DEFENSE MINISTER IS RUNNING THESE EXACT NUMBERS.
          </p>
          <p className="text-sm sm:text-lg font-bold leading-snug" style={{ color: 'var(--green-dim)' }}>
            WE THOUGHT THE PUBLIC SHOULD HAVE ACCESS TOO.
          </p>
        </div>

        {/* Boot log */}
        <div className="space-y-1 text-sm">
          {BOOT_LOG.map((line, i) => (
            <p
              key={i}
              className={`reveal-line${i === BOOT_LOG.length - 1 ? ' cursor' : ''}`}
              style={{ animationDelay: `${0.2 + i * 0.25}s` }}
            >
              <span style={{ color: TAG_COLOR[line.tag] ?? 'var(--text-dim)' }}>
                [{line.tag}]&nbsp;
              </span>
              <span style={{ color: i === BOOT_LOG.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                {line.text}
              </span>
            </p>
          ))}
        </div>

        {/* CTAs — pinned to bottom */}
        <div className="mt-auto flex flex-col sm:flex-row gap-0">
          <Link
            href="/calculator"
            style={{ background: 'var(--green)', color: 'var(--bg)', border: '1px solid var(--green)' }}
            className="inline-flex items-center justify-center px-10 py-4 text-base font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            &gt; INITIATE ANALYSIS
          </Link>
          <Link
            href="/methodology"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', marginLeft: '-1px' }}
            className="inline-flex items-center justify-center px-10 py-4 text-base tracking-widest uppercase hover:text-[var(--green)] hover:border-[var(--green-dim)] transition-colors"
          >
            &gt; READ METHODOLOGY
          </Link>
        </div>
      </div>

      {/* BOTTOM ROW — two hover-reveal panels side by side */}
      <div className="grid grid-cols-2 gap-0" style={{ borderTop: '1px solid var(--border)' }}>

        {/* Live situation feed — hover to reveal */}
        <div className="reveal-group" style={{ borderRight: '1px solid var(--border)' }}>
          {/* Trigger tab */}
          <div
            className="px-5 py-3 flex items-center gap-2 cursor-default"
            style={{ background: 'var(--panel)' }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 5px var(--green)', flexShrink: 0 }}
            />
            <span className="text-sm tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              LIVE SITUATION FEED
            </span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>— HOVER —</span>
          </div>
          {/* Panel */}
          <div
            className="reveal-panel absolute z-20"
            style={{
              left: 0, right: 0,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderTop: 'none',
            }}
          >
            {INTEL.map((item, i) => (
              <div
                key={item.label}
                className="px-5 py-3 flex items-baseline justify-between gap-4"
                style={{ borderBottom: i < INTEL.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div>
                  <p className="text-sm tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
                </div>
                <p className="text-xl font-bold tabular-nums glow shrink-0" style={{ color: 'var(--green)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notice / disclaimer — hover to reveal */}
        <div className="reveal-group">
          <div
            className="px-5 py-3 flex items-center gap-2 cursor-default"
            style={{ background: 'var(--panel)' }}
          >
            <span className="text-sm tracking-widest uppercase glow-amber" style={{ color: 'var(--amber)' }}>
              ⚠ NOTICE
            </span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>— HOVER —</span>
          </div>
          <div
            className="reveal-panel absolute z-20"
            style={{
              left: 0, right: 0,
              background: 'rgba(255,176,0,0.04)',
              border: '1px solid var(--amber)',
              borderTop: 'none',
            }}
          >
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--amber)', opacity: 0.85 }}>
                FOR EDUCATIONAL AND POLICY ANALYSIS PURPOSES ONLY.
                THE ACTUAL COST IS ALWAYS HIGHER THAN THE PROJECTION USED TO JUSTIFY THE DECISION.
                DOES NOT MODEL NUCLEAR ESCALATION, CYBER WARFARE, OR ALLIANCE COSTS.
              </p>
              <p className="text-xs" style={{ color: 'var(--amber)', opacity: 0.45 }}>
                IF THIS TOOL PREVENTS EVEN ONE SLIDE IN ONE BRIEFING FROM BEING OPTIMISTIC, IT HAS DONE ITS JOB.
              </p>
              <Link href="/methodology" className="text-xs underline" style={{ color: 'var(--amber)', opacity: 0.7, display: 'block' }}>
                READ FULL METHODOLOGY
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-5 py-5 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="space-y-1">
          <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>DATA SOURCES</p>
          <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            World Bank WDI · SIPRI (CC BY-NC) · UNHCR · IMF WEO · UN Comtrade · Watson Institute · IEA · WHO · UNICEF · REST Countries
          </p>
        </div>
        <div className="space-y-1">
          <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>DISCLAIMER</p>
          <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            FOR EDUCATIONAL AND POLICY ANALYSIS PURPOSES ONLY.{' '}
            <Link href="/methodology" className="underline" style={{ color: 'var(--text-dim)' }}>FULL METHODOLOGY</Link>.
          </p>
        </div>
        <div className="space-y-1">
          <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>SYSTEM</p>
          <p style={{ color: 'var(--text-muted)' }}>&quot;THE ONLY WINNING MOVE IS NOT TO PLAY.&quot;</p>
          <p style={{ color: 'var(--text-muted)' }}>— W.O.P.R., 1983</p>
        </div>
      </div>

    </div>
  );
}
