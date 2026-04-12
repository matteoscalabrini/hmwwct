'use client';

import { useState } from 'react';
import { formatCompactUsd, formatCount } from '@/lib/terminal/formatters';

interface CostFrame {
  label: string;
  value: string;
}

function buildCostFrames(totalUsd: number, taxpayers: number): CostFrame[] {
  return [
    { label: 'PER TAXPAYER', value: formatCompactUsd(totalUsd / Math.max(1, taxpayers)) },
    { label: 'HOSPITALS NEVER BUILT', value: formatCount(Math.round(totalUsd / 500_000_000)) },
    { label: 'YEARS OF GLOBAL VACCINATION', value: (totalUsd / 8_000_000_000).toFixed(1) },
    { label: 'APOLLO PROGRAMS', value: (totalUsd / 288_000_000_000).toFixed(1) },
    { label: 'TIMES THE 2008 BAILOUT', value: (totalUsd / 700_000_000_000).toFixed(1) },
  ];
}

interface Props {
  totalUsd: number;
  aggressorPop: number;
}

export function InHumanTerms({ totalUsd, aggressorPop }: Props) {
  const frames = buildCostFrames(totalUsd, aggressorPop);
  const [i, setI] = useState(0);

  if (frames.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setI((i + 1) % frames.length)}
      className="t-data"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--fg)',
        fontFamily: '"Ioskeley Mono", monospace',
        padding: 'var(--s-2) 0',
      }}
    >
      <span className="fg-phos">&gt;</span> {frames[i].value} {frames[i].label}
      <span className="t-label fg-mute" style={{ marginLeft: '1ch' }}>
        [{i + 1}/{frames.length}] CLICK TO CYCLE
      </span>
    </button>
  );
}
