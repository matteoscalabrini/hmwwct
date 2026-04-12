'use client';

import { Panel } from '@/components/terminal/Panel';
import { DataTable } from '@/components/terminal/DataTable';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { formatCount } from '@/lib/terminal/formatters';
import opportunityCosts from '@/lib/data/opportunity-costs.json';

interface Props {
  totalCost: number | null;
}

export function InsteadPanel({ totalCost }: Props) {
  if (totalCost === null) {
    return (
      <Panel title="INSTEAD">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const items = opportunityCosts.items
    .map((item) => ({
      id: item.id,
      label: item.label.toUpperCase(),
      quantity: Math.floor(totalCost / item.unitCostUsd),
    }))
    .filter((item) => item.quantity >= 1)
    .slice(0, 6);

  return (
    <Panel title="INSTEAD">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <p className="t-label fg-dim">&gt; INSTEAD OF THIS WAR, YOU COULD HAVE:</p>

        <DataTable>
          {items.map((item) => (
            <DataTable.Row
              key={item.id}
              label={item.label}
              value={formatCount(item.quantity)}
            />
          ))}
        </DataTable>
      </div>
    </Panel>
  );
}
