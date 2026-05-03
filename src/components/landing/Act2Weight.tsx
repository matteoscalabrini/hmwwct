'use client';

import { useEffect, useRef, useState } from 'react';
import { WEIGHT_FACTS, WeightFact } from '@/lib/landing/weight';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Format large numbers with commas — jsdom doesn't support toLocaleString reliably
function groupDigits(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatFactValue(value: number): string {
  return groupDigits(value);
}

interface WeightFactSectionProps {
  fact: WeightFact;
}

function WeightFactSection({ fact }: WeightFactSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState<number>(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const raf = requestAnimationFrame(() => setDisplayed(fact.value));
      return () => cancelAnimationFrame(raf);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fact.value, triggered]);

  useEffect(() => {
    if (!triggered || prefersReducedMotion()) return;

    const durationMs = 800;
    const startTime = performance.now();
    const target = fact.value;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [triggered, fact.value]);

  return (
    <div
      ref={ref}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'var(--s-8) var(--s-7)',
      }}
    >
      <div
        className="t-hero fg-phos"
        aria-label={`${fact.prefix}${formatFactValue(fact.value)}`}
      >
        {fact.prefix}{formatFactValue(displayed)}
      </div>
      <p
        className="t-body fg-dim"
        style={{ marginTop: 'var(--s-6)', marginBottom: 0 }}
      >
        {fact.label}
      </p>
    </div>
  );
}

export function Act2Weight() {
  return (
    <section aria-label="Weight — key facts">
      {WEIGHT_FACTS.map((fact, i) => (
        <WeightFactSection key={i} fact={fact} />
      ))}
    </section>
  );
}
