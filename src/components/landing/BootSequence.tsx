'use client';

import { useEffect, useRef, useState } from 'react';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { BOOT_LINES } from '@/lib/landing/bootLines';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface BootSequenceProps {
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);
  const calledComplete = useRef(false);

  function finish() {
    if (calledComplete.current) return;
    calledComplete.current = true;
    sessionStorage.setItem('hmwwct.booted', '1');
    onComplete();
  }

  function handleSkip() {
    finish();
  }

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisibleCount(BOOT_LINES.length);
      setDone(true);
      const id = setTimeout(finish, 100);
      return () => clearTimeout(id);
    }

    // Advance one line at a time with 150ms between each
    if (visibleCount >= BOOT_LINES.length) {
      setDone(true);
      const id = setTimeout(finish, 500);
      return () => clearTimeout(id);
    }

    const delay = BOOT_LINES[visibleCount] === '' ? 200 : 150;
    const id = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount]);

  const lastLineIndex = BOOT_LINES.length - 1;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: 'var(--s-8) var(--s-7)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* SKIP button */}
      <button
        onClick={handleSkip}
        className="t-label fg-dim"
        style={{
          position: 'fixed',
          top: 'var(--s-4)',
          right: 'var(--s-4)',
          background: 'transparent',
          border: '1px solid var(--fg-mute)',
          color: 'var(--fg-dim)',
          padding: 'var(--s-1) var(--s-3)',
          cursor: 'pointer',
        }}
        aria-label="Skip boot sequence"
      >
        [SKIP]
      </button>

      {/* Boot lines */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            className="t-body fg-phos"
            style={{
              fontFamily: '"Ioskeley Mono", monospace',
              minHeight: '1.55em',
              color: line.startsWith('> WARNING') ? 'var(--alert)' : undefined,
            }}
          >
            {line === '' ? '\u00a0' : line}
            {done && i === lastLineIndex && <BlinkCursor />}
          </div>
        ))}
      </div>
    </div>
  );
}
