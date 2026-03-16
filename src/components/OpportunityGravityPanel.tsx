'use client';

import { OpportunityContextMetric, OpportunityCostItem } from '@/types';
import { formatNumber } from '@/lib/utils/formatting';
import { OPPORTUNITY_ICONS, OPPORTUNITY_ID_ICON_FALLBACKS } from '@/lib/utils/opportunity-icons';
import { Heart } from 'lucide-react';

interface OpportunityGravityPanelProps {
  metrics: OpportunityContextMetric[];
  items: OpportunityCostItem[];
  loading: boolean;
  error: string | null;
}

interface ComparisonRow {
  id: string;
  label: string;
  iconName: string;
  currentLabel: string;
  currentValue: number;
  currentUnit: string;
  fundedLabel: string;
  fundedValue: number;
  fundedUnit: string;
  asOf: string;
  note: string;
}

const ICON_SLOTS = 18;

export function OpportunityGravityPanel({
  metrics,
  items,
  loading,
  error,
}: OpportunityGravityPanelProps) {
  const rows: ComparisonRow[] = metrics
    .map((metric) => {
      const funded = items.find((item) => item.id === metric.id);
      if (!funded) return null;

      return {
        id: metric.id,
        label: metric.label,
        iconName: funded.iconName,
        currentLabel: metric.currentLabel,
        currentValue: metric.currentValue,
        currentUnit: metric.currentUnit,
        fundedLabel: funded.label,
        fundedValue: funded.quantity,
        fundedUnit: funded.unit,
        asOf: metric.asOf,
        note: metric.note,
      };
    })
    .filter((row): row is ComparisonRow => row !== null);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
          &gt; WHAT THE SAME MONEY COULD BUY
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Compared against live World Bank baselines for the target nation.
          Only categories with strong country-level coverage are shown.
        </p>
      </div>

      {loading && (
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg)' }} className="p-5 space-y-2">
          <p className="text-xs tracking-widest uppercase cursor" style={{ color: 'var(--green-dim)' }}>
            LOADING LIVE NATIONAL BASELINES
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Pulling the latest World Bank observations for the selected target nation.
          </p>
        </div>
      )}

      {error && !loading && (
        <div style={{ border: '1px solid var(--red)', background: 'rgba(255,68,68,0.05)' }} className="p-5 space-y-2">
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--red)' }}>
            OPPORTUNITY CONTEXT UNAVAILABLE
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {rows.map((row) => (
            <ComparisonCard key={row.id} row={row} />
          ))}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No strong live baselines were available for this target nation.
        </p>
      )}
    </section>
  );
}

function ComparisonCard({ row }: { row: ComparisonRow }) {
  const Icon = OPPORTUNITY_ICONS[row.iconName] ?? OPPORTUNITY_ID_ICON_FALLBACKS[row.id] ?? Heart;
  const ratio = row.currentValue > 0 ? row.fundedValue / row.currentValue : 0;
  const comparisonHeading = ratio >= 1 ? `${formatRatio(ratio)}x` : formatPercent(ratio * 100);
  const iconFieldMax = Math.max(row.currentValue, row.fundedValue, 1);

  return (
    <article
      className="relative overflow-hidden p-5 sm:p-6 space-y-5"
      style={{
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(74,222,128,0.08) 0%, rgba(0,0,0,0) 100%)',
      }}
    >
      <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
        <Icon size={88} style={{ color: 'var(--green)' }} strokeWidth={1.2} />
      </div>

      <div className="flex items-start gap-4">
        <div
          className="h-14 w-14 shrink-0 flex items-center justify-center"
          style={{ border: '1px solid rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.10)' }}
        >
          <Icon size={28} style={{ color: 'var(--green)' }} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--green)' }}>
            {row.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Latest baseline: {row.asOf}. {row.note}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 items-start">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.24em] uppercase" style={{ color: 'var(--text-dim)' }}>
            Scale
          </p>
          <div className="text-4xl sm:text-5xl font-bold tabular-nums glow" style={{ color: 'var(--green)' }}>
            {comparisonHeading}
          </div>
          <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--green-dim)' }}>
            OF THE CURRENT NATIONAL BASELINE
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {describeComparison(row.fundedValue, row.currentValue)}
          </p>
        </div>

        <div className="space-y-4">
          <IconSignalField
            iconName={row.iconName}
            id={row.id}
            label={row.currentLabel}
            value={row.currentValue}
            unit={row.currentUnit}
            maxValue={iconFieldMax}
            tone="muted"
          />
          <IconSignalField
            iconName={row.iconName}
            id={row.id}
            label={row.fundedLabel}
            value={row.fundedValue}
            unit={row.fundedUnit}
            maxValue={iconFieldMax}
            tone="bright"
          />
        </div>
      </div>
    </article>
  );
}

function IconSignalField({
  iconName,
  id,
  label,
  value,
  unit,
  maxValue,
  tone,
}: {
  iconName: string;
  id: string;
  label: string;
  value: number;
  unit: string;
  maxValue: number;
  tone: 'muted' | 'bright';
}) {
  const Icon = OPPORTUNITY_ICONS[iconName] ?? OPPORTUNITY_ID_ICON_FALLBACKS[id] ?? Heart;
  const filledCount =
    value <= 0 ? 0 : Math.max(1, Math.round((value / Math.max(maxValue, 1)) * ICON_SLOTS));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="tracking-[0.16em] uppercase" style={{ color: 'var(--text-dim)' }}>
          {label}
        </span>
        <span
          className="font-bold tabular-nums"
          style={{ color: tone === 'bright' ? 'var(--green)' : 'var(--text-dim)' }}
        >
          {formatNumber(value)} {unit}
        </span>
      </div>
      <div
        className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        {Array.from({ length: ICON_SLOTS }, (_, index) => {
          const isFilled = index < filledCount;
          const color = isFilled
            ? (tone === 'bright' ? 'var(--green)' : '#ffffff')
            : '#333333';

          return (
            <div
              key={`${label}-${index}`}
              className="flex items-center justify-center"
              style={{
                minHeight: '18px',
                filter: isFilled && tone === 'bright' ? 'drop-shadow(0 0 8px rgba(74,222,128,0.35))' : 'none',
              }}
            >
              <Icon size={16} style={{ color }} strokeWidth={1.8} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function describeComparison(fundedValue: number, currentValue: number): string {
  if (currentValue <= 0) return 'No reliable current baseline is available for comparison.';

  const ratio = fundedValue / currentValue;
  if (ratio >= 1) {
    return `Equivalent to ${formatRatio(ratio)}x the current national baseline.`;
  }

  return `${formatPercent(ratio * 100)} of the current national baseline.`;
}

function formatRatio(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function formatPercent(value: number): string {
  if (value >= 10) return `${value.toFixed(0)}%`;
  if (value >= 1) return `${value.toFixed(1)}%`;
  return `${value.toFixed(2)}%`;
}
