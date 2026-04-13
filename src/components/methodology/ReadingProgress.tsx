'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setPct(docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  const filled = Math.round(pct / 100 * 40);
  const bar = '█'.repeat(filled) + '░'.repeat(40 - filled);

  return (
    <div aria-label="Reading progress" role="progressbar" aria-valuenow={pct}
      className="t-label" style={{
        position: 'fixed', top: 'var(--header-h)', left: 0, right: 0,
        background: 'var(--bg)', borderBottom: '1px solid var(--fg-mute)',
        padding: '2px var(--s-4)', zIndex: 40, color: 'var(--fg-dim)',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
      <span style={{ color: 'var(--phosphor)' }}>{bar}</span> {pct}%
    </div>
  );
}
