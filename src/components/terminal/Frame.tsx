'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { ParticleField } from './ParticleField';
import { Scanlines } from './Scanlines';
import { StatusStrip } from './StatusStrip';

interface FrameProps {
  children: ReactNode;
  version: string;
}

export function Frame({ children, version }: FrameProps) {
  const pathname = usePathname() ?? '/';
  return (
    <>
      <ParticleField />
      <Header currentPath={pathname} />
      <Scanlines />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'var(--header-h)',
          paddingBottom: 'var(--status-h)',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
      <StatusStrip uplink="NOMINAL" sources={9} sourceTotal={9} version={version} />
    </>
  );
}
