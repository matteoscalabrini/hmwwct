import { OpportunityCostItem } from '@/types';
import { formatNumber } from '@/lib/utils/formatting';

interface OpportunityCostProps {
  items: OpportunityCostItem[];
  totalUsd: number;
}

export function OpportunityCost({ items }: OpportunityCostProps) {
  const visible = items.filter((item) => item.quantity >= 1).slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
          ALTERNATIVELY, THIS COULD FUND
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          Based on WHO, UNICEF, and World Bank unit costs.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visible.map((item) => (
          <div
            key={item.label}
            className="p-3 flex flex-col gap-1"
            style={{ border: '1px solid var(--border)', background: 'var(--green-faint)' }}
          >
            <div className="text-base font-bold tabular-nums glow" style={{ color: 'var(--green)' }}>
              {formatNumber(item.quantity)}
            </div>
            <div className="text-xs leading-tight tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        FOR CONTEXT ONLY — NOT INCLUDED IN TOTAL COST ESTIMATE.
        UNIT COSTS: WHO · UNICEF · WORLD BANK · ILO.
      </p>
    </div>
  );
}
