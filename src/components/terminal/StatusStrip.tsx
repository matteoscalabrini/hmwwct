'use client';

import { useLiveClock } from '@/lib/terminal/useLiveClock';

interface StatusStripProps {
  uplink: 'NOMINAL' | 'QUERYING' | 'DEGRADED';
  sources: number;
  sourceTotal: number;
  version: string;
}

export function StatusStrip({ uplink, sources, sourceTotal, version }: StatusStripProps) {
  const clock = useLiveClock();
  const dotColor =
    uplink === 'NOMINAL'  ? 'var(--phosphor)' :
    uplink === 'QUERYING' ? 'var(--phosphor)' :
                            'var(--alert)';

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--status-h)',
        borderTop: 'var(--border-1)',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--frame-pad)',
        gap: 'var(--s-5)',
        zIndex: 40,
      }}
      className="t-label"
    >
      <span style={{ display: 'flex', gap: '0.5ch', alignItems: 'center' }}>
        UPLINK
        <span aria-hidden="true" style={{ color: dotColor }}>●</span>
        <span className="fg-dim">{uplink}</span>
      </span>
      <span className="fg-dim">SOURCES {sources}/{sourceTotal}</span>
      <span className="fg-dim">{clock}</span>
      <span className="fg-dim" style={{ marginLeft: 'auto' }}>WOPR v{version}</span>
    </footer>
  );
}
