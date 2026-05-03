import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { IBM_Plex_Mono, JetBrains_Mono, VT323, Workbench } from 'next/font/google';
import './globals.css';
import { Frame } from '@/components/terminal';
import { Providers } from '@/components/Providers';
import pkg from '../../package.json';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
});

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
  title: 'HMWWCT · How Much Would a War Cost There?',
  description: 'An educational calculator for the economic and humanitarian cost of hypothetical military conflict, built from real data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${jetbrainsMono.variable} ${vt323.variable} ${workbench.variable}`}
    >
      <head />
      <body>
        <Providers>
          <Frame version={pkg.version}>
            {children}
          </Frame>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
