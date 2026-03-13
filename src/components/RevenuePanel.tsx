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

      {/* Assumption warning */}
      <div className="rounded-lg p-4 space-y-2" style={{ border: '1px solid var(--accent-amber)', background: 'rgba(245,158,11,0.06)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--accent-amber)' }}>
          Speculative Module — Read Assumptions
        </p>
        <ul className="space-y-1">
          {revenue.assumptions.map((a, i) => (
            <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="shrink-0" style={{ color: 'var(--accent-amber)' }}>&bull;</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Revenue line items */}
      {revenue.items.length === 0 ? (
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            No extractable resource revenue identified for this target.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            The target is not a major producer and has no significant monetary gold reserves.
          </p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {revenue.items.map((item, i) => (
            <div
              key={item.label}
              className="p-4 flex items-start justify-between gap-4"
              style={{ borderBottom: i < revenue.items.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {item.label}
                  </span>
                  <Badge variant={item.confidence}>{item.confidence}</Badge>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.note}</p>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-sm font-bold tabular-nums font-mono" style={{ color: 'var(--accent-emerald)' }}>
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

      {/* Net position */}
      <div className="rounded-lg p-5 space-y-3" style={{ border: `1px solid ${netColor}`, background: isLoss ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Revenue (Best Case)
            </p>
            <p className="text-xl font-bold tabular-nums font-mono" style={{ color: 'var(--accent-emerald)' }}>
              {formatCurrency(revenue.totalUsd)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Projected Cost
            </p>
            <p className="text-xl font-bold tabular-nums font-mono" style={{ color: 'var(--accent-red)' }}>
              {formatCurrency(projectedCostUsd)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Excludes separate economic impact
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${netColor}`, paddingTop: '0.75rem' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Net Position
          </p>
          <p className="text-3xl font-bold tabular-nums font-mono" style={{ color: netColor }}>
            {isLoss ? '' : '+'}{formatCurrency(revenue.netPositionUsd)}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Break-even
          </p>
          <p className="text-lg font-bold" style={{ color: netColor }}>
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

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {revenue.confidenceNote}
      </p>
    </div>
  );
}
