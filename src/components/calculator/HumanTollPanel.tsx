'use client';

import { Panel } from '@/components/terminal/Panel';
import { CharBar } from '@/components/terminal/CharBar';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { formatCount } from '@/lib/terminal/formatters';

interface Props {
  displaced: number | null;
  targetPopulation: number | null;
}

export function HumanTollPanel({ displaced, targetPopulation }: Props) {
  if (displaced === null) {
    return (
      <Panel title="HUMAN TOLL" tone="alert">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const ratio = targetPopulation ? displaced / targetPopulation : 0;

  return (
    <Panel title="HUMAN TOLL" tone="alert">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <div>
          <span className="t-hero fg-alert">{formatCount(displaced)}</span>
          <span className="t-title fg-dim" style={{ marginLeft: 'var(--s-2)' }}>DISPLACED</span>
        </div>

        {targetPopulation && (
          <CharBar
            label="OF TARGET POP"
            value={ratio}
            displayValue={`${formatCount(targetPopulation)} total`}
            percent={Math.round(ratio * 100)}
            tone="alert"
          />
        )}

        <p className="t-label fg-dim" style={{ fontStyle: 'italic' }}>
          &gt; EVERY ICON BELOW IS ONE PERSON. SCROLL TO GRIEVE.
        </p>

        <div style={{ minHeight: 200, border: '1px dashed var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="t-label fg-mute">MEMORIAL CANVAS — TASK 2.12</span>
        </div>
      </div>
    </Panel>
  );
}
