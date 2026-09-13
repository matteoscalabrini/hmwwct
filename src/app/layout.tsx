import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Frame } from '@/components/terminal';
import { Providers } from '@/components/Providers';
import pkg from '../../package.json';

export const metadata: Metadata = {
  title: 'HMWWCT · How Much Would a War Cost There?',
  description: 'An educational calculator for the economic and humanitarian cost of hypothetical military conflict, built from real data.',
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
