import { ReactNode } from 'react';
import { BlinkCursor } from './BlinkCursor';

interface TerminalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  type?: 'button' | 'submit';
}

export function TerminalButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  loadingLabel = 'CALCULATING',
  type = 'button',
}: TerminalButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className="t-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5ch',
        padding: 'var(--s-2) var(--s-3)',
        background: 'transparent',
        border: '1px solid var(--phosphor)',
        color: isDisabled ? 'var(--fg-dim)' : 'var(--phosphor)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: '"Ioskeley Mono", monospace',
      }}
    >
      <span>&gt; {loading ? loadingLabel : children}</span>
      {!loading && !isDisabled && <BlinkCursor char="▌" />}
    </button>
  );
}
