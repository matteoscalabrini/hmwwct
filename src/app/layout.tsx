import type { Metadata } from 'next';
import { JetBrains_Mono, VT323, Workbench } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
});

const workbench = Workbench({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-workbench',
});

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
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${vt323.variable} ${workbench.variable}`}
    >
      <head />
      <body>
        <div className="min-h-screen flex flex-col">
          <nav className="shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="max-w-screen-2xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="terminal-panel-muted flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-2.5 w-2.5 rounded-full animate-pulse-dot shrink-0"
                    style={{
                      background: 'var(--accent-emerald)',
                      boxShadow: '0 0 10px rgba(105, 209, 127, 0.7)',
                    }}
                  />
                  <div className="min-w-0">
                    <div className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
                      HMWWCT // STRATEGIC COST ANALYSIS
                    </div>
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      Transparent war-cost modeling with cited public inputs
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/calculator" className="terminal-button terminal-button-subtle">
                    Open Calculator
                  </Link>
                  <Link href="/methodology" className="terminal-button terminal-button-subtle terminal-button-ghost">
                    Methodology
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
