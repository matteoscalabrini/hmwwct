'use client';

import { useState } from 'react';
import { CostCategory } from '@/types';
import { formatCurrency, formatCurrencyRange, formatConfidence } from '@/lib/utils/formatting';
import { SourceCitation } from './SourceCitation';
import { Badge } from './ui/Badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CostBreakdownProps {
  categories: Record<string, CostCategory>;
}

export function CostBreakdown({ categories }: CostBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {Object.entries(categories).map(([key, cat]) => (
        <div key={key} className="terminal-panel overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(expanded === key ? null : key)}
            className="w-full flex min-h-[4.5rem] items-center gap-3 px-4 py-4 text-left transition-colors focus:outline-none sm:px-5"
            style={{ background: expanded === key ? 'rgba(84, 245, 214, 0.05)' : 'transparent' }}
            aria-expanded={expanded === key}
          >
            {expanded === key
              ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text)' }}>
                  {cat.label}
                </span>
                <SourceCitation sources={cat.sources} />
              </div>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                Range: {formatCurrencyRange(cat.amountMin, cat.amountMax)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="fs-number font-bold tabular-nums font-mono" style={{ color: 'var(--accent-cyan)' }}>
                {formatCurrency(cat.amount)}
              </div>
              <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                Point estimate
              </div>
            </div>
          </button>

          {expanded === key && (
            <div style={{ borderTop: '1px solid var(--border)' }} className="space-y-4 px-4 py-4 sm:px-5">
              <p className="text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
                {cat.methodology}
              </p>
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 py-3"
                    style={{ borderBottom: i < cat.items.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-secondary)' }}>
                          {item.label}
                        </span>
                        {item.isEstimate && <Badge variant="static">est.</Badge>}
                        <Badge variant={item.confidence}>{formatConfidence(item.confidence)}</Badge>
                        <SourceCitation sources={item.sources} />
                      </div>
                      {item.assumptions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.assumptions.map((a) => (
                            <p key={a.id} className="text-xs font-mono leading-6" style={{ color: 'var(--text-muted)' }}>
                              {a.formula}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="fs-number font-bold tabular-nums font-mono whitespace-nowrap shrink-0" style={{ color: 'var(--accent-cyan)' }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
