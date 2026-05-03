import { useEffect, useRef, useState } from 'react';

export function useTicker(ratePerSecond: number, enabled: boolean) {
  const [accrued, setAccrued] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || ratePerSecond <= 0) {
      const raf = requestAnimationFrame(() => setAccrued(0));
      return () => cancelAnimationFrame(raf);
    }

    // Honor prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setAccrued(ratePerSecond));
      return () => cancelAnimationFrame(raf);
    }

    startRef.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - (startRef.current ?? now)) / 1000;
      setAccrued(elapsed * ratePerSecond);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ratePerSecond, enabled]);

  return enabled && ratePerSecond > 0 ? accrued : 0;
}
