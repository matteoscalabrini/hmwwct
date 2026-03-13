import { Source } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';

interface SourceCitationProps {
  sources: Source[];
  className?: string;
}

export function SourceCitation({ sources, className = '' }: SourceCitationProps) {
  if (sources.length === 0) return null;

  return (
    <Tooltip
      className={className}
      content={
        <div className="space-y-2">
          <p className="terminal-kicker mb-1" style={{ color: 'var(--accent-cyan)' }}>Data Sources</p>
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Badge variant={s.isStatic ? 'static' : 'live'} className="mt-0.5 shrink-0">
                {s.isStatic ? 'Static' : 'Live'}
              </Badge>
              <div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  {s.name}
                </a>
                {s.indicator && <span style={{ color: 'var(--text-muted)' }}> ({s.indicator})</span>}
                <span style={{ color: 'var(--text-muted)' }}> · {s.year}</span>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={`View ${sources.length} data source${sources.length > 1 ? 's' : ''}`}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold focus:outline-none"
        style={{
          border: '1px solid var(--border-bright)',
          color: 'var(--text-muted)',
          background: 'rgba(18, 33, 27, 0.72)',
          cursor: 'pointer',
        }}
      >
        ?
      </span>
    </Tooltip>
  );
}
