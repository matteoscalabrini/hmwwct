import { ReactNode } from 'react';
import { Stamp } from './Stamp';

interface PanelProps {
  title: string;
  tone?: 'default' | 'phosphor' | 'alert';
  children: ReactNode;
  className?: string;
}

export function Panel({ title, tone = 'default', children, className = '' }: PanelProps) {
  const borderColor =
    tone === 'phosphor' ? 'var(--phosphor)' :
    tone === 'alert'    ? 'var(--alert)' :
                          'var(--fg-mute)';

  return (
    <section
      data-tone={tone}
      className={className}
      style={{
        position: 'relative',
        border: `1px solid ${borderColor}`,
        background: 'var(--bg-panel)',
        padding: 'var(--s-4)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <header style={{ marginBottom: 'var(--s-3)' }}>
        <Stamp>{title}</Stamp>
      </header>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children}
      </div>
    </section>
  );
}
