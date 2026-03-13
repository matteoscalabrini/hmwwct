interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'static' | 'low' | 'medium' | 'high' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    live: { border: '1px solid rgba(105, 209, 127, 0.45)', color: 'var(--accent-emerald)', background: 'rgba(105, 209, 127, 0.12)' },
    static: { border: '1px solid rgba(247, 191, 99, 0.45)', color: 'var(--accent-amber)', background: 'rgba(247, 191, 99, 0.12)' },
    high: { border: '1px solid rgba(105, 209, 127, 0.45)', color: 'var(--accent-emerald)', background: 'rgba(105, 209, 127, 0.12)' },
    medium: { border: '1px solid rgba(247, 191, 99, 0.45)', color: 'var(--accent-amber)', background: 'rgba(247, 191, 99, 0.12)' },
    low: { border: '1px solid rgba(255, 118, 91, 0.45)', color: 'var(--accent-red)', background: 'rgba(255, 118, 91, 0.12)' },
    neutral: { border: '1px solid var(--border-bright)', color: 'var(--text-secondary)', background: 'rgba(18, 33, 27, 0.45)' },
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
