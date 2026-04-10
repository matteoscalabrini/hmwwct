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
      setRevealed(fullText);
      return;
    }

    setRevealed('');
    const chars = Array.from(fullText);
    if (chars.length === 0) return;

    const intervalMs = Math.max(1, Math.floor(totalDurationMs / chars.length));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(chars.slice(0, i).join(''));
      if (i >= chars.length) clearInterval(id);
    }, intervalMs);

    return () => clearInterval(id);
  }, [fullText, totalDurationMs]);

  return revealed;
}
