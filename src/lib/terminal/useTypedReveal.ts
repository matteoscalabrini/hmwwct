'use client';

import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useTypedReveal(fullText: string, totalDurationMs: number): string {
  const [revealed, setRevealed] = useState(() =>
    prefersReducedMotion() ? fullText : ''
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => setRevealed(fullText), 0);
      return () => window.clearTimeout(id);
    }

    const chars = Array.from(fullText);
    const resetId = window.setTimeout(() => setRevealed(''), 0);
    if (chars.length === 0) {
      return () => window.clearTimeout(resetId);
    }

    const intervalMs = Math.max(1, Math.floor(totalDurationMs / chars.length));
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setRevealed(chars.slice(0, i).join(''));
      if (i >= chars.length) window.clearInterval(id);
    }, intervalMs);

    return () => {
      window.clearTimeout(resetId);
      window.clearInterval(id);
    };
  }, [fullText, totalDurationMs]);

  return revealed;
}
