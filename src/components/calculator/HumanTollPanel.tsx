'use client';

import { useState } from 'react';
import { Panel } from '@/components/terminal/Panel';
import { CharBar } from '@/components/terminal/CharBar';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { PersonMemorialCanvas } from '@/components/terminal/PersonMemorialCanvas';
import { MemorialImmersiveOverlay } from '@/components/calculator/MemorialImmersiveOverlay';
import { formatCount } from '@/lib/terminal/formatters';

interface Props {
  displaced: number | null;
  targetPopulation: number | null;
}

export function HumanTollPanel({ displaced, targetPopulation }: Props) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  if (displaced === null) {
    return (
      <Panel title="HUMAN TOLL" tone="alert">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const ratio = targetPopulation ? displaced / targetPopulation : 0;

  return (
    <>
      <Panel title="HUMAN TOLL" tone="alert">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <span className="t-hero fg-alert">{formatCount(displaced)}</span>
              <span className="t-title fg-dim" style={{ marginLeft: 'var(--s-2)' }}>DISPLACED</span>
            </div>
            <button
              className="t-label fg-dim"
              onClick={() => setOverlayOpen(true)}
              style={{
                background: 'none',
                border: '1px solid var(--fg-mute)',
                color: 'inherit',
                padding: 'var(--s-1) var(--s-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              aria-label="Expand memorial to full screen"
            >
              [EXPAND]
            </button>
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

          <span className="sr-only" aria-label={`${formatCount(displaced)} people displaced, shown as individual icons`} />
          <PersonMemorialCanvas
            total={displaced}
            childRatio={0.4}
            casualtyRatio={0.005}
            height={360}
          />
        </div>
      </Panel>

      <MemorialImmersiveOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        total={displaced}
      />
    </>
  );
}
