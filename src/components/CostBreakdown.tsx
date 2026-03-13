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
    <div className="space-y-2">
      {Object.entries(categories).map(([key, cat]) => (
        <div key={key} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            type="button"
            onClick={() => setExpanded(expanded === key ? null : key)}
            className="w-full flex items-center gap-3 p-4 text-left transition-colors focus:outline-none"
            style={{ background: expanded === key ? 'var(--surface-bright)' : 'transparent' }}
            aria-expanded={expanded === key}
          >
            {expanded === key
              ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {cat.label}
                </span>
                <SourceCitation sources={cat.sources} />
              </div>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                Range: {formatCurrencyRange(cat.amountMin, cat.amountMax)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold tabular-nums font-mono" style={{ color: 'var(--accent-cyan)' }}>
                {formatCurrency(cat.amount)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Point est.</div>
            </div>
          </button>

          {expanded === key && (
            <div style={{ borderTop: '1px solid var(--border)' }} className="p-4 space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {cat.methodology}
              </p>
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 py-2"
                    style={{ borderBottom: i < cat.items.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        {item.isEstimate && <Badge variant="static">est.</Badge>}
                        <Badge variant={item.confidence}>{formatConfidence(item.confidence)}</Badge>
                        <SourceCitation sources={item.sources} />
                      </div>
                      {item.assumptions.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.assumptions.map((a) => (
                            <p key={a.id} className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                              {a.formula}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold tabular-nums font-mono whitespace-nowrap" style={{ color: 'var(--accent-cyan)' }}>
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
