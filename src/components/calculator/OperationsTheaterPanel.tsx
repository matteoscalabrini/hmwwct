'use client';

import { useState } from 'react';
import { Panel } from '@/components/terminal/Panel';
import { BlockGridMap } from '@/components/terminal/BlockGridMap';
import { InspectorStrip } from './InspectorStrip';
import { buildTradeOverlay, buildSanctionsOverlay } from '@/lib/calculator/geographyOfLoss';

interface CountryInfo {
  name: string;
  population?: number;
}

interface Props {
  aggressor: string | null;
  target: string | null;
  countriesByIso: Record<string, CountryInfo>;
}

export function OperationsTheaterPanel({ aggressor, target, countriesByIso }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState<'theater' | 'trade' | 'sanctions'>('theater');

  let overlay: Map<string, string> | undefined;
  if (overlayMode === 'trade' && aggressor && target) {
    overlay = buildTradeOverlay(aggressor, target);
  } else if (overlayMode === 'sanctions' && aggressor) {
    overlay = buildSanctionsOverlay(aggressor);
  }

  return (
    <Panel title="OPERATIONS THEATER">
      <div style={{ display: 'flex', gap: 'var(--s-2)', marginBottom: 'var(--s-2)' }}>
        {(['theater', 'trade', 'sanctions'] as const).map(mode => (
          <button key={mode} onClick={() => setOverlayMode(mode)}
            className="t-label" style={{
              background: overlayMode === mode ? 'var(--phosphor)' : 'transparent',
              color: overlayMode === mode ? 'var(--bg)' : 'var(--fg-dim)',
              border: '1px solid var(--fg-mute)', padding: 'var(--s-1) var(--s-2)',
              cursor: 'pointer',
            }}>
            {mode === 'theater' ? 'THEATER' : mode === 'trade' ? 'TRADE IMPACT' : 'SANCTIONS REACH'}
          </button>
        ))}
      </div>
      <BlockGridMap
        aggressor={aggressor ?? ''}
        target={target ?? ''}
        overlay={overlay}
        onHoverCountry={setHover}
      />
      <InspectorStrip
        iso={hover}
        country={hover ? countriesByIso[hover] ?? null : null}
      />
    </Panel>
  );
}
