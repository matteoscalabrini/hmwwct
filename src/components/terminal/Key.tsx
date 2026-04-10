import { ReactNode } from 'react';

interface KeyProps {
  children: ReactNode;
  active?: boolean;
}

export function Key({ children, active = false }: KeyProps) {
  return (
    <span
      data-active={active || undefined}
      className="t-label"
      style={{
        display: 'inline-block',
        padding: '1px 4px',
        color: active ? 'var(--bg)' : 'var(--fg-dim)',
        background: active ? 'var(--phosphor)' : 'transparent',
      }}
    >
      [{children}]
    </span>
  );
}
