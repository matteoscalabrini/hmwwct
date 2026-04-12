'use client';

import { Panel } from '@/components/terminal/Panel';
import { CharBar } from '@/components/terminal/CharBar';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { computeYourShare } from '@/lib/calculator/yourShare';
import { formatCompactUsd } from '@/lib/terminal/formatters';

interface Props {
  totalCost: number | null;
  aggressorPop: number | undefined;
  aggressorName: string | undefined;
}

export function PerPersonPanel({ totalCost, aggressorPop, aggressorName }: Props) {
  if (totalCost === null || aggressorPop === undefined) {
    return (
      <Panel title="PER PERSON">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const { perCapita, sectors } = computeYourShare(totalCost, aggressorPop);
  const maxAmount = Math.max(...sectors.map((s) => s.amount));

  return (
    <Panel title="PER PERSON">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <div>
          <span className="t-hero fg">{formatCompactUsd(perCapita)}</span>
          <span className="t-title fg-dim" style={{ marginLeft: 'var(--s-2)' }}>
            PER ADULT TAXPAYER{aggressorName ? ` (${aggressorName.toUpperCase()})` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {sectors.map((sector) => (
            <CharBar
              key={sector.name}
              label={sector.name}
              value={maxAmount > 0 ? sector.amount / maxAmount : 0}
              displayValue={formatCompactUsd(sector.amount)}
              percent={sector.pct}
            />
          ))}
        </div>

        <p className="t-label fg-dim">
          &gt; THIS IS YOUR SHARE OF THE BILL.
        </p>
      </div>
    </Panel>
  );
}
