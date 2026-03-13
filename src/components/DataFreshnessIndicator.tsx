import { WarCostResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface DataFreshnessIndicatorProps {
  dataFreshness: WarCostResult['dataFreshness'];
  hasStaticFallback: boolean;
}

export function DataFreshnessIndicator({ dataFreshness, hasStaticFallback }: DataFreshnessIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center text-xs" style={{ color: 'var(--text-muted)' }}>
      <span>Data:</span>
      <Badge variant={hasStaticFallback ? 'static' : 'live'}>
        {hasStaticFallback ? 'Partial Static' : 'Live API'}
      </Badge>
      <span>{dataFreshness.worldBank}</span>
      <span>&middot;</span>
      <span>{dataFreshness.sipri}</span>
    </div>
  );
}
