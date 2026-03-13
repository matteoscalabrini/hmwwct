interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'static' | 'low' | 'medium' | 'high' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    live:    { border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)' },
    static:  { border: '1px solid var(--accent-amber)',   color: 'var(--accent-amber)',   background: 'rgba(245,158,11,0.1)' },
    high:    { border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)' },
    medium:  { border: '1px solid var(--accent-amber)',   color: 'var(--accent-amber)',   background: 'rgba(245,158,11,0.1)' },
    low:     { border: '1px solid var(--accent-red)',     color: 'var(--accent-red)',     background: 'rgba(239,68,68,0.1)' },
    neutral: { border: '1px solid var(--border-bright)',  color: 'var(--text-secondary)', background: 'transparent' },
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
