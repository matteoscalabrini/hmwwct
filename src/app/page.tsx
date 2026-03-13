'use client';

import Link from 'next/link';

const STATS = [
  { value: '$2,443B', label: 'GLOBAL DEFENSE SPENDING', source: 'SIPRI 2024' },
  { value: '56', label: 'ACTIVE ARMED CONFLICTS', source: 'ACLED 2024' },
  { value: '$8T+', label: 'US POST-9/11 WAR COSTS', source: 'WATSON INSTITUTE' },
  { value: '117M', label: 'DISPLACED PERSONS', source: 'UNHCR 2024' },
];

const FEATURES = [
  {
    color: 'var(--accent-cyan)',
    tag: 'DATA',
    title: 'LIVE FEEDS',
    description:
      'World Bank, SIPRI, IMF, and FRED APIs. Real-time economic and military data. No static estimates.',
  },
  {
    color: 'var(--accent-amber)',
    tag: 'AUDIT',
    title: 'FULL TRANSPARENCY',
    description:
      'Every number cited with source, methodology, and assumptions. Every formula exposed. No black boxes.',
  },
  {
    color: 'var(--accent-emerald)',
    tag: 'SCALE',
    title: 'CONTEXT ENGINE',
    description:
      'Compare costs to national budgets, GDP, per-capita burden, and humanitarian benchmarks.',
  },
];

export default function Home() {
  return (
    <div className="grid-bg relative">
      {/* HERO */}
      <section
        className="flex flex-col justify-center relative"
        style={{ minHeight: 'calc(100vh - 2.5rem)' }}
      >
        <div className="max-w-screen-xl mx-auto px-6 py-20 flex-1 flex flex-col justify-center">
          {/* System status */}
          <div className="flex items-center gap-3 mb-8">
            <span
              className="classification-label"
              style={{ color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }}
            >
              UNCLASSIFIED // FOUO
            </span>
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              SYSTEM ONLINE
            </span>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-none mb-4 font-workbench"
            style={{ color: '#ffffff' }}
          >
            HOW MUCH WOULD
            <br />
            A WAR COST THERE<span className="animate-blink" style={{ color: 'var(--accent-cyan)' }}>_</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-sm md:text-base max-w-xl mb-10 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Real data. Transparent methodology.<br />
            Calculate what defense ministers know but rarely share.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center px-6 py-2.5 text-xs uppercase tracking-widest font-bold transition-all duration-150 hover:brightness-125"
              style={{
                background: 'var(--accent-red)',
                color: '#ffffff',
                border: '1px solid var(--accent-red)',
              }}
            >
              &gt; OPEN CALCULATOR
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center justify-center px-6 py-2.5 text-xs uppercase tracking-widest font-bold transition-all duration-150"
              style={{
                border: '1px solid var(--border-bright)',
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-muted)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-bright)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              &gt; READ METHODOLOGY
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-screen-xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} style={{ borderLeft: '2px solid var(--border-bright)', paddingLeft: '12px' }}>
                <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--accent-cyan)' }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  {stat.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        className="max-w-screen-xl mx-auto py-16 px-6"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-5 transition-colors duration-150"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderTop: `2px solid ${feature.color}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="classification-label"
                  style={{ color: feature.color, borderColor: feature.color }}
                >
                  {feature.tag}
                </span>
              </div>
              <h3
                className="text-sm font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text)' }}
              >
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            FOR EDUCATIONAL AND POLICY ANALYSIS PURPOSES ONLY
          </p>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>WORLD BANK / SIPRI / UNHCR / IMF / WATSON / FRED</span>
            <span style={{ color: 'var(--border-bright)' }}>|</span>
            <Link
              href="/methodology"
              className="uppercase tracking-wider transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              [METHOD]
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
