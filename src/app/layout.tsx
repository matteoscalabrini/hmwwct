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
      <body className="min-h-screen antialiased">

        {/* TICKER — scrolling status line */}
        <div
          className="overflow-hidden text-xs tracking-widest uppercase py-1"
          style={{ background: 'var(--green)', color: 'var(--bg)', borderBottom: '1px solid var(--green-dim)' }}
        >
          {/* Text duplicated for seamless marquee loop */}
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
        <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }} className="sticky top-0 z-40">
          <div className="px-4 sm:px-10 h-11 flex items-center justify-between">
            <a href="/" className="glow text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
              W.O.P.R. <span style={{ color: 'var(--text-dim)' }}>//</span> HMWWCT
            </a>
            <div className="flex items-center gap-6 text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              <span className="hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                EDUCATIONAL MODE ACTIVE
              </span>
              <a href="/calculator" className="hover:text-[var(--green)] transition-colors">&gt; CALCULATOR</a>
              <a href="/methodology" className="hover:text-[var(--green)] transition-colors">&gt; METHODOLOGY</a>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid var(--border)' }} className="mt-20 py-10">
          <div className="px-4 sm:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs" style={{ color: 'var(--text-dim)' }}>
              <div className="space-y-2">
                <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>DATA SOURCES</p>
                <p className="leading-relaxed">
                  World Bank WDI · SIPRI Military Expenditure DB (CC BY-NC) · UNHCR Global Trends ·
                  IMF World Economic Outlook · UN Comtrade · Watson Institute Costs of War ·
                  IEA · WHO · UNICEF · REST Countries API
                </p>
              </div>
              <div className="space-y-2">
                <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>DISCLAIMER</p>
                <p className="leading-relaxed">
                  FOR EDUCATIONAL AND POLICY ANALYSIS PURPOSES ONLY. All estimates carry significant
                  uncertainty and should be interpreted as illustrative ranges, not precise predictions.{' '}
                  <a href="/methodology" className="underline" style={{ color: 'var(--green-dim)' }}>
                    FULL METHODOLOGY
                  </a>.
                </p>
              </div>
              <div className="space-y-2">
                <p className="tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>SYSTEM</p>
                <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  &quot;A STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY.&quot;
                </p>
                <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  — W.O.P.R., WarGames (1983)
                </p>
                <p className="leading-relaxed mt-2">
                  The irony of needing this calculator in 2025 is not lost on us.
                </p>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
