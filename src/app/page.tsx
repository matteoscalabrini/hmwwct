'use client';

import { useState } from 'react';
import { BootSequence } from '@/components/landing/BootSequence';
import { Act1Boot } from '@/components/landing/Act1Boot';
import { Act2Weight } from '@/components/landing/Act2Weight';
import { Act3Call } from '@/components/landing/Act3Call';

export default function Home() {
  const [booted, setBooted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('hmwwct.booted') === '1';
  });

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <main>
      <Act1Boot />
      <Act2Weight />
      <Act3Call />
    </main>
  );
}
