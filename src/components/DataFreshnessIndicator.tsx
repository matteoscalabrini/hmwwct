import { WarCostResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface DataFreshnessIndicatorProps {
  dataFreshness: WarCostResult['dataFreshness'];
  hasStaticFallback: boolean;
}

export function DataFreshnessIndicator({ dataFreshness, hasStaticFallback }: DataFreshnessIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>
      <span>DATA FEED:</span>
      <Badge variant={hasStaticFallback ? 'static' : 'live'}>
        {hasStaticFallback ? 'PARTIAL STATIC' : 'LIVE API'}
      </Badge>
      <span>{dataFreshness.worldBank}</span>
      <span style={{ color: 'var(--text-muted)' }}>·</span>
      <span>{dataFreshness.sipri}</span>
    </div>
  );
}
