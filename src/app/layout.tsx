import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HMWWCT // STRATEGIC COST ANALYSIS SYSTEM',
  description:
    'Calculate the estimated economic and humanitarian cost of a hypothetical military conflict between any two countries, using real data from World Bank, SIPRI, UNHCR, and IMF.',
  keywords: ['war cost calculator', 'military spending', 'conflict economics', 'defense budget', 'peace'],
  openGraph: {
    title: 'How Much Would a War Cost There?',
    description: 'Real data. Transparent methodology. Calculate the true cost of war.',
    type: 'website',
    siteName: 'HMWWCT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Much Would a War Cost There?',
    description: 'Real data. Transparent methodology. Calculate the true cost of war.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Workbench&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="monitor-wrapper">
          <div className="monitor-bezel">

            {/* Bezel brand strip */}
            <div className="monitor-brand-strip">
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#2a2d32', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>
                W.O.P.R. SYSTEMS INC.
              </span>
              {/* Power LED */}
              <span
                title="SYSTEM ONLINE"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'inline-block',
                  boxShadow: '0 0 6px var(--green)',
                  animation: 'blink 2.5s step-end infinite',
                }}
              />
            </div>

            {/* The screen */}
            <div className="monitor-screen">

              {/* TICKER */}
              <div
                className="overflow-hidden text-xs tracking-widest uppercase"
                style={{ background: 'var(--green)', color: 'var(--bg)', borderBottom: '1px solid var(--green-dim)', padding: '3px 0' }}
              >
                <span style={{ display: 'inline-block', animation: 'marquee 50s linear infinite', whiteSpace: 'nowrap' }} aria-hidden="true">
                  &nbsp;&nbsp;&nbsp;⚡ GLOBAL DEFENSE SPENDING 2024: $2,443B — UP 7.4% YOY (SIPRI)
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  UN PEACEKEEPING BUDGET FY24: $6.5B — 0.27% OF GLOBAL MILITARY SPEND
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  ACTIVE ARMED CONFLICTS: 56 (ACLED 2024) — HIGHEST SINCE COLD WAR
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  COSTS OF WAR PROJECT: U.S. POST-9/11 WARS TOTAL $8T AND COUNTING
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  RECONSTRUCTION COSTS ALWAYS ESTIMATED LAST. ALWAYS WRONG.
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  THIS SYSTEM IS FOR EDUCATIONAL USE. THE DECISION-MAKERS HAVE THEIR OWN.
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;⚡ GLOBAL DEFENSE SPENDING 2024: $2,443B — UP 7.4% YOY (SIPRI)
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  UN PEACEKEEPING BUDGET FY24: $6.5B — 0.27% OF GLOBAL MILITARY SPEND
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  ACTIVE ARMED CONFLICTS: 56 (ACLED 2024) — HIGHEST SINCE COLD WAR
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  COSTS OF WAR PROJECT: U.S. POST-9/11 WARS TOTAL $8T AND COUNTING
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  RECONSTRUCTION COSTS ALWAYS ESTIMATED LAST. ALWAYS WRONG.
                  &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
                  THIS SYSTEM IS FOR EDUCATIONAL USE. THE DECISION-MAKERS HAVE THEIR OWN.
                  &nbsp;&nbsp;&nbsp;
                </span>
              </div>

              {/* NAV */}
              <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
                <div className="px-5 h-10 flex items-center justify-between">
                  <a href="/" className="glow text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
                    W.O.P.R. <span style={{ color: 'var(--text-dim)' }}>//</span> HMWWCT
                  </a>
                  <div className="flex items-center gap-6 text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                    <span className="hidden sm:block" style={{ color: 'var(--text-muted)' }}>EDUCATIONAL MODE</span>
                    <a href="/calculator" className="hover:text-[var(--green)] transition-colors">&gt; CALCULATOR</a>
                    <a href="/methodology" className="hover:text-[var(--green)] transition-colors">&gt; METHODOLOGY</a>
                  </div>
                </div>
              </nav>

              {/* Page content */}
              <main style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</main>


            </div>{/* end .monitor-screen */}
          </div>{/* end .monitor-bezel */}
        </div>{/* end .monitor-wrapper */}
      </body>
    </html>
  );
}
