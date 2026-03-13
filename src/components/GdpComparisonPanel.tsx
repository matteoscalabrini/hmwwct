'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/formatting';

interface GdpComparisonPanelProps {
  totalCost: number;
  targetName: string;
}

interface ReferenceCountry {
  name: string;
  flag: string;
  gdp: number; // in USD
}

const REFERENCE_COUNTRIES: ReferenceCountry[] = [
  { name: 'Tonga', flag: '\ud83c\uddf9\ud83c\uddf4', gdp: 500e6 },
  { name: 'Samoa', flag: '\ud83c\uddfc\ud83c\uddf8', gdp: 850e6 },
  { name: 'Belize', flag: '\ud83c\udde7\ud83c\uddff', gdp: 2e9 },
  { name: 'Montenegro', flag: '\ud83c\uddf2\ud83c\uddea', gdp: 6.1e9 },
  { name: 'Moldova', flag: '\ud83c\uddf2\ud83c\udde9', gdp: 14.4e9 },
  { name: 'Jamaica', flag: '\ud83c\uddef\ud83c\uddf2', gdp: 17.1e9 },
  { name: 'Iceland', flag: '\ud83c\uddee\ud83c\uddf8', gdp: 28e9 },
  { name: 'Cyprus', flag: '\ud83c\udde8\ud83c\uddfe', gdp: 31e9 },
  { name: 'Paraguay', flag: '\ud83c\uddf5\ud83c\uddfe', gdp: 42e9 },
  { name: 'Tunisia', flag: '\ud83c\uddf9\ud83c\uddf3', gdp: 47e9 },
  { name: 'Croatia', flag: '\ud83c\udded\ud83c\uddf7', gdp: 72e9 },
  { name: 'Kenya', flag: '\ud83c\uddf0\ud83c\uddea', gdp: 110e9 },
  { name: 'Morocco', flag: '\ud83c\uddf2\ud83c\udde6', gdp: 134e9 },
  { name: 'Hungary', flag: '\ud83c\udded\ud83c\uddfa', gdp: 188e9 },
  { name: 'New Zealand', flag: '\ud83c\uddf3\ud83c\uddff', gdp: 249e9 },
  { name: 'Portugal', flag: '\ud83c\uddf5\ud83c\uddf9', gdp: 287e9 },
  { name: 'Chile', flag: '\ud83c\udde8\ud83c\uddf1', gdp: 335e9 },
  { name: 'Ireland', flag: '\ud83c\uddee\ud83c\uddea', gdp: 533e9 },
  { name: 'Argentina', flag: '\ud83c\udde6\ud83c\uddf7', gdp: 632e9 },
  { name: 'Sweden', flag: '\ud83c\uddf8\ud83c\uddea', gdp: 590e9 },
  { name: 'Belgium', flag: '\ud83c\udde7\ud83c\uddea', gdp: 624e9 },
  { name: 'Poland', flag: '\ud83c\uddf5\ud83c\uddf1', gdp: 811e9 },
  { name: 'Netherlands', flag: '\ud83c\uddf3\ud83c\uddf1', gdp: 1.09e12 },
  { name: 'Turkey', flag: '\ud83c\uddf9\ud83c\uddf7', gdp: 1.11e12 },
  { name: 'South Korea', flag: '\ud83c\uddf0\ud83c\uddf7', gdp: 1.67e12 },
  { name: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa', gdp: 1.72e12 },
  { name: 'Brazil', flag: '\ud83c\udde7\ud83c\uddf7', gdp: 2.17e12 },
  { name: 'France', flag: '\ud83c\uddeb\ud83c\uddf7', gdp: 3.05e12 },
  { name: 'Germany', flag: '\ud83c\udde9\ud83c\uddea', gdp: 4.46e12 },
  { name: 'Japan', flag: '\ud83c\uddef\ud83c\uddf5', gdp: 4.23e12 },
];

export function GdpComparisonPanel({ totalCost, targetName }: GdpComparisonPanelProps) {
  const { exceeded, firstNotExceeded, combinedGdp } = useMemo(() => {
    const sorted = [...REFERENCE_COUNTRIES].sort((a, b) => a.gdp - b.gdp);
    const exc = sorted.filter((c) => totalCost > c.gdp);
    const first = sorted.find((c) => totalCost <= c.gdp) ?? null;
    const combined = exc.reduce((sum, c) => sum + c.gdp, 0);
    return { exceeded: exc, firstNotExceeded: first, combinedGdp: combined };
  }, [totalCost]);

  if (exceeded.length === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          GDP Comparison
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This conflict&apos;s cost is below the GDP of the smallest reference economy (
          {REFERENCE_COUNTRIES[0].name}: {formatCurrency(REFERENCE_COUNTRIES[0].gdp)}).
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="space-y-1">
        <h3
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          GDP Comparison
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This conflict over {targetName} would cost more than the entire annual GDP of:
        </p>
      </div>

      {/* Country tags grid */}
      <div className="flex flex-wrap gap-2">
        {exceeded.map((c) => (
          <div
            key={c.name}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--accent-red)',
            }}
          >
            <span>{c.flag}</span>
            <span className="font-medium">{c.name}</span>
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatCurrency(c.gdp)}
            </span>
          </div>
        ))}
        {firstNotExceeded && (
          <div
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
            }}
          >
            <span>{firstNotExceeded.flag}</span>
            <span className="font-medium">{firstNotExceeded.name}</span>
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatCurrency(firstNotExceeded.gdp)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>(exceeds war cost)</span>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div
        className="rounded-lg px-4 py-3 space-y-1"
        style={{
          background: 'var(--surface-bright)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            Combined GDP of {exceeded.length} countries above
          </span>
          <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
            {formatCurrency(combinedGdp)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>War cost</span>
          <span
            className="font-mono font-semibold"
            style={{ color: 'var(--accent-red)' }}
          >
            {formatCurrency(totalCost)}
          </span>
        </div>
        {totalCost > combinedGdp && (
          <p
            className="text-xs pt-1 font-medium"
            style={{ color: 'var(--accent-red)' }}
          >
            The war cost exceeds even the combined GDP of all {exceeded.length} countries.
          </p>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        GDP figures are approximate annual values (World Bank / IMF estimates).
      </p>
    </div>
  );
}
