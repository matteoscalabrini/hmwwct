'use client';

import { useState } from 'react';
import { Panel } from '@/components/terminal/Panel';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { MemorialImmersiveOverlay } from '@/components/calculator/MemorialImmersiveOverlay';
import { formatCount } from '@/lib/terminal/formatters';

interface Props {
  killed: number | null;
  displaced: number | null;
  targetPopulation: number | null;
}

export function HumanTollPanel({ killed, displaced, targetPopulation }: Props) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  if (killed === null) {
    return (
      <Panel title="HUMAN TOLL" tone="alert">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const pct = targetPopulation && killed > 0
    ? `${((killed / targetPopulation) * 100).toFixed(2)}% OF TARGET POPULATION`
    : null;

  return (
    <>
      <Panel title="HUMAN TOLL" tone="alert">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div>
            <span className="t-hero fg-alert">{formatCount(killed)}</span>
            <span className="t-title fg-dim" style={{ marginLeft: 'var(--s-2)' }}>DEAD</span>
          </div>

          {pct && <p className="t-label fg-dim">{pct}</p>}

          {displaced !== null && (
            <p className="t-data fg-dim">{formatCount(displaced)} DISPLACED</p>
          )}

          <span className="sr-only">{formatCount(killed)} people killed</span>

          <button
            className="t-label"
            onClick={() => setOverlayOpen(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--alert)',
              color: 'var(--alert)',
              padding: 'var(--s-2) var(--s-3)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              alignSelf: 'flex-start',
            }}
          >
            [VISUALIZE DATA]
          </button>
        </div>
      </Panel>

      <MemorialImmersiveOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        total={killed}
        casualtyRatio={1}
        childRatio={0}
      />
    </>
  );
}
