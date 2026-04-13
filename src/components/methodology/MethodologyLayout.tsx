'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ReadingProgress } from './ReadingProgress';

interface Props {
  sections: { id: string; label: string }[];
  children: ReactNode;
}

export function MethodologyLayout({ sections, children }: Props) {
  return (
    <>
      <ReadingProgress />
      <div style={{ display: 'flex', gap: 'var(--s-7)', padding: 'var(--s-4)', maxWidth: 1200, margin: '0 auto' }}>
        <Sidebar sections={sections} />
        <main style={{ flex: 1, maxWidth: '72ch' }}>
          {children}
        </main>
      </div>
    </>
  );
}
