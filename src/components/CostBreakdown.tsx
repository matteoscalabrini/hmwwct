'use client';

import { useState } from 'react';
import { CostCategory } from '@/types';
import { formatCurrency, formatCurrencyRange, formatConfidence } from '@/lib/utils/formatting';
import { SourceCitation } from './SourceCitation';
import { Badge } from './ui/Badge';

interface CostBreakdownProps {
  categories: Record<string, CostCategory>;
}

export function CostBreakdown({ categories }: CostBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {Object.entries(categories).map(([key, cat]) => (
        <div key={key} style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
          <button
            type="button"
            onClick={() => setExpanded(expanded === key ? null : key)}
            className="w-full flex items-center gap-4 p-4 text-left transition-colors focus:outline-none"
            style={{ background: expanded === key ? 'rgba(0,255,65,0.04)' : 'transparent' }}
            aria-expanded={expanded === key}
          >
            <span className="text-xs shrink-0" style={{ color: 'var(--green-dim)' }}>
              {expanded === key ? '▼' : '▶'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--green)' }}>
                  {cat.label}
                </span>
                <SourceCitation sources={cat.sources} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                RANGE: {formatCurrencyRange(cat.amountMin, cat.amountMax)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold tabular-nums glow" style={{ color: 'var(--green)' }}>
                {formatCurrency(cat.amount)}
              </div>
              <div className="text-xs tracking-wider" style={{ color: 'var(--text-dim)' }}>POINT EST.</div>
            </div>
          </button>

          {expanded === key && (
            <div style={{ borderTop: '1px solid var(--border)' }} className="p-4 space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {cat.methodology}
              </p>
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 py-2"
                    style={{ borderBottom: i < cat.items.length - 1 ? '1px solid var(--green-faint)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--green-dim)' }}>{item.label}</span>
                        {item.isEstimate && <Badge variant="static">est.</Badge>}
                        <Badge variant={item.confidence}>{formatConfidence(item.confidence)}</Badge>
                        <SourceCitation sources={item.sources} />
                      </div>
                      {item.assumptions.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.assumptions.map((a) => (
                            <p key={a.id} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                              {a.formula}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: 'var(--green)' }}>
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
