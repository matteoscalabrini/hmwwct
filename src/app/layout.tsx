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
          href="https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500;700&family=Workbench&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
          {/* Status bar */}
          <nav
            className="shrink-0"
            style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div className="max-w-screen-2xl mx-auto px-4 h-10 flex items-center justify-between">
              {/* Left: system indicator */}
              <a href="/" className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                  style={{
                    background: 'var(--accent-emerald)',
                    boxShadow: '0 0 6px var(--accent-emerald)',
                  }}
                />
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--text-secondary)', letterSpacing: '0.15em' }}
                >
                  HMWWCT
                </span>
                <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                  // STRATEGIC COST ANALYSIS
                </span>
              </a>
              {/* Right: nav links */}
              <div className="flex items-center gap-1 text-xs uppercase tracking-wider">
                <a
                  href="/calculator"
                  className="px-3 py-1 transition-colors hover:text-[var(--accent-cyan)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  [CALC]
                </a>
                <a
                  href="/methodology"
                  className="px-3 py-1 transition-colors hover:text-[var(--accent-cyan)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  [METHOD]
                </a>
              </div>
            </div>
          </nav>
          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
