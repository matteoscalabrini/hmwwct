'use client';

import { Panel } from '@/components/terminal/Panel';
import { CharBar } from '@/components/terminal/CharBar';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { formatCompactUsd } from '@/lib/terminal/formatters';
import historicalWars from '@/lib/data/historical-wars.json';

interface Props {
  totalCost: number | null;
}

export function HistoryPanel({ totalCost }: Props) {
  if (totalCost === null) {
    return (
      <Panel title="HISTORY">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const allEntries = [
    ...historicalWars.map((w) => ({ name: w.name, cost: w.costUsd2024, isCurrent: false })),
    { name: 'THIS WAR', cost: totalCost, isCurrent: true },
  ];

  const maxCost = Math.max(...allEntries.map((e) => e.cost));

  return (
    <Panel title="HISTORY">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        {allEntries.map((entry) => (
          <CharBar
            key={entry.name}
            label={entry.name}
            value={maxCost > 0 ? entry.cost / maxCost : 0}
            displayValue={formatCompactUsd(entry.cost)}
            tone={entry.isCurrent ? 'alert' : 'default'}
          />
        ))}
      </div>
    </Panel>
  );
}
