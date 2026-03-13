import { WarRevenueResult } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';
import { Badge } from './ui/Badge';

interface RevenuePanelProps {
  revenue: WarRevenueResult;
  projectedCostUsd: number;
}

export function RevenuePanel({ revenue, projectedCostUsd }: RevenuePanelProps) {
  const isLoss = revenue.netPositionUsd < 0;
  const netColor = isLoss ? 'var(--accent-red)' : 'var(--accent-emerald)';

  return (
    <div className="space-y-4">
      <div className="terminal-callout is-warn space-y-3 px-5 py-4">
        <p className="terminal-kicker" style={{ color: 'var(--accent-amber)' }}>
          Speculative Module — Read Assumptions
        </p>
        <ul className="space-y-2">
          {revenue.assumptions.map((a, i) => (
            <li key={i} className="flex gap-2 text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
              <span className="shrink-0" style={{ color: 'var(--accent-amber)' }}>&bull;</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {revenue.items.length === 0 ? (
        <div className="terminal-panel px-5 py-4">
          <p className="text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
            No extractable resource revenue identified for this target.
          </p>
          <p className="mt-2 text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
            The target is not a major producer and has no significant monetary gold reserves.
          </p>
        </div>
      ) : (
        <div className="terminal-panel overflow-hidden">
          {revenue.items.map((item, i) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 px-5 py-4"
              style={{ borderBottom: i < revenue.items.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text)' }}>
                    {item.label}
                  </span>
                  <Badge variant={item.confidence}>{item.confidence}</Badge>
                </div>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>{item.note}</p>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-lg font-bold tabular-nums font-mono" style={{ color: 'var(--accent-emerald)' }}>
                  {formatCurrency(item.totalUsd)}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(item.annualUsd)}/yr
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`terminal-callout space-y-4 px-5 py-5 ${isLoss ? 'is-danger' : 'is-success'}`}
        style={{ borderColor: netColor }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Total Revenue (Best Case)
            </p>
            <p className="mt-2 fs-number font-bold tabular-nums font-mono" style={{ color: 'var(--accent-emerald)' }}>
              {formatCurrency(revenue.totalUsd)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Projected Cost
            </p>
            <p className="mt-2 fs-number font-bold tabular-nums font-mono" style={{ color: 'var(--accent-red)' }}>
              {formatCurrency(projectedCostUsd)}
            </p>
            <p className="mt-1 text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
              Excludes separate economic impact
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${netColor}`, paddingTop: '0.75rem' }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
            Net Position
          </p>
          <p className="mt-2 fs-number font-bold tabular-nums font-mono" style={{ color: netColor }}>
            {isLoss ? '' : '+'}{formatCurrency(revenue.netPositionUsd)}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
            Break-even
          </p>
          <p className="mt-2 font-display text-3xl leading-none tracking-[0.08em]" style={{ color: netColor }}>
            {revenue.breakEvenYears === null
              ? 'Never'
              : revenue.breakEvenYears > 500
              ? 'Never (>500 yrs)'
              : `${revenue.breakEvenYears} years`}
          </p>
          {revenue.breakEvenYears !== null && revenue.breakEvenYears <= 500 && (
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
              At {formatCurrency(revenue.annualRateUsd)}/yr revenue rate.
            </p>
          )}
        </div>
      </div>

      <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
        {revenue.confidenceNote}
      </p>
    </div>
  );
}
