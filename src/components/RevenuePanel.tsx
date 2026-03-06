import { WarRevenueResult } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';

interface RevenuePanelProps {
  revenue: WarRevenueResult;
  totalCostUsd: number;
}

function confidenceBadge(c: 'high' | 'medium' | 'low') {
  const colors: Record<string, string> = {
    high: 'var(--green-dim)',
    medium: 'var(--amber)',
    low: 'var(--text-dim)',
  };
  return (
    <span
      className="text-xs tracking-widest uppercase px-1"
      style={{ border: `1px solid ${colors[c]}`, color: colors[c] }}
    >
      {c}
    </span>
  );
}

export function RevenuePanel({ revenue, totalCostUsd }: RevenuePanelProps) {
  const isLoss = revenue.netPositionUsd < 0;
  const netColor = isLoss ? 'var(--red)' : 'var(--green)';

  return (
    <div className="space-y-4">

      {/* Assumption warning */}
      <div style={{ border: '1px solid var(--amber)', background: 'rgba(255,176,0,0.04)' }} className="p-4 space-y-2">
        <p className="text-xs font-bold tracking-widest uppercase glow-amber" style={{ color: 'var(--amber)' }}>
          ⚠ SPECULATIVE MODULE — READ ASSUMPTIONS
        </p>
        <ul className="space-y-1">
          {revenue.assumptions.map((a, i) => (
            <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--amber)', opacity: 0.75 }}>
              <span className="shrink-0">//</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Revenue line items */}
      {revenue.items.length === 0 ? (
        <div className="p-4" style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            NO EXTRACTABLE RESOURCE REVENUE IDENTIFIED FOR THIS TARGET.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            // target is not a major commodity producer per IEA/USGS/FAO data
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
          {revenue.items.map((item, i) => (
            <div
              key={item.label}
              className="p-4 flex items-start justify-between gap-4"
              style={{ borderBottom: i < revenue.items.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--green-dim)' }}>
                    {item.label}
                  </span>
                  {confidenceBadge(item.confidence)}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.note}</p>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--green-dim)' }}>
                  {formatCurrency(item.totalUsd)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(item.annualUsd)}/yr
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Net position */}
      <div style={{ border: `1px solid ${netColor}`, background: isLoss ? 'rgba(255,68,68,0.04)' : 'rgba(168,218,255,0.03)' }} className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>
              TOTAL REVENUE (BEST CASE)
            </p>
            <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--green-dim)' }}>
              {formatCurrency(revenue.totalUsd)}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>
              TOTAL COST
            </p>
            <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--red)' }}>
              {formatCurrency(totalCostUsd)}
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${netColor}`, paddingTop: '0.75rem' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>
            NET POSITION
          </p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: netColor }}>
            {isLoss ? '' : '+'}{formatCurrency(revenue.netPositionUsd)}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>
            BREAK-EVEN
          </p>
          <p className="text-lg font-bold" style={{ color: netColor }}>
            {revenue.breakEvenYears === null
              ? 'NEVER'
              : revenue.breakEvenYears > 500
              ? 'NEVER (>500 YRS)'
              : `${revenue.breakEvenYears} YEARS`}
          </p>
          {revenue.breakEvenYears !== null && revenue.breakEvenYears <= 500 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              // at {formatCurrency(revenue.annualRateUsd)}/yr revenue rate
            </p>
          )}
        </div>
      </div>

      {/* Confidence note */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {revenue.confidenceNote}
      </p>
    </div>
  );
}
