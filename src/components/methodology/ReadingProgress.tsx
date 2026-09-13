'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const [barChars, setBarChars] = useState(40);

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

  useEffect(() => {
    const update = () => setBarChars(window.innerWidth < 480 ? 28 : 40);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filled = Math.round(pct / 100 * barChars);
  const bar = '█'.repeat(filled) + '░'.repeat(barChars - filled);

  return (
    <div aria-label="Reading progress" role="progressbar" aria-valuenow={pct}
      className="t-label" style={{
        position: 'fixed', top: 'var(--header-h)', left: 0, right: 0,
        height: 'var(--methodology-progress-h)',
        background: 'var(--bg)', borderBottom: '1px solid var(--fg-mute)',
        display: 'flex', alignItems: 'center',
        padding: '0 var(--s-4)', zIndex: 40, color: 'var(--fg-dim)',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
      <span aria-hidden="true" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
        <span style={{ color: 'var(--accent)' }}>{bar}</span>
      </span>
      <span style={{ flex: '0 0 auto', marginLeft: 'var(--s-2)' }}>{pct}%</span>
    </div>
  );
}
