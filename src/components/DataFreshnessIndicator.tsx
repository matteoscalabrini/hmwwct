import { WarCostResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface DataFreshnessIndicatorProps {
  dataFreshness: WarCostResult['dataFreshness'];
  hasStaticFallback: boolean;
}

export function DataFreshnessIndicator({ dataFreshness, hasStaticFallback }: DataFreshnessIndicatorProps) {
  const details = [
    dataFreshness.worldBank,
    dataFreshness.sipri,
    dataFreshness.unhcr,
    dataFreshness.comtrade,
    dataFreshness.acled,
    dataFreshness.fred,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 py-1 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span className="terminal-kicker">Data</span>
      <Badge variant={hasStaticFallback ? 'static' : 'live'}>
        {hasStaticFallback ? 'Partial Static' : 'Live API'}
      </Badge>
      {details.map((detail, index) => (
        <span key={detail}>
          {index > 0 && <span className="mr-2">&middot;</span>}
          {detail}
        </span>
      ))}
    </div>
  );
}
