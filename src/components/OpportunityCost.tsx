import { OpportunityCostItem } from '@/types';
import { STRONG_OPPORTUNITY_ID_SET } from '@/constants/opportunity-focus';
import { formatNumber } from '@/lib/utils/formatting';
import { OPPORTUNITY_ICONS, OPPORTUNITY_ID_ICON_FALLBACKS } from '@/lib/utils/opportunity-icons';
import { Heart } from 'lucide-react';

interface OpportunityCostProps {
  items: OpportunityCostItem[];
}

export function OpportunityCost({ items }: OpportunityCostProps) {
  const visible = items
    .filter((item) => STRONG_OPPORTUNITY_ID_SET.has(item.id) && item.quantity >= 1)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
          ALTERNATIVELY, THIS COULD FUND
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          Focused on categories with strong live national baseline data.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visible.map((item) => (
          <OpportunityTile key={item.id} item={item} />
        ))}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        FOR CONTEXT ONLY — NOT INCLUDED IN TOTAL COST ESTIMATE.
        UNIT COSTS: WHO · WORLD BANK · ILO · UNICEF · WFP.
      </p>
    </div>
  );
}

function OpportunityTile({ item }: { item: OpportunityCostItem }) {
  const Icon = OPPORTUNITY_ICONS[item.iconName] ?? OPPORTUNITY_ID_ICON_FALLBACKS[item.id] ?? Heart;

  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{ border: '1px solid var(--border)', background: 'var(--green-faint)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-bold tabular-nums glow" style={{ color: 'var(--green)' }}>
          {formatNumber(item.quantity)}
        </div>
        <div
          className="h-8 w-8 shrink-0 flex items-center justify-center"
          style={{ border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.08)' }}
        >
          <Icon size={16} style={{ color: 'var(--green-dim)' }} />
        </div>
      </div>
      <div className="text-xs leading-tight tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
        {item.label}
      </div>
    </div>
  );
}
