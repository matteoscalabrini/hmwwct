interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'static' | 'low' | 'medium' | 'high' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    live:    { border: '1px solid var(--green-dim)',  color: 'var(--green)',     background: 'rgba(0,255,65,0.08)' },
    static:  { border: '1px solid var(--amber)',      color: 'var(--amber)',     background: 'rgba(255,176,0,0.08)' },
    high:    { border: '1px solid var(--green-dim)',  color: 'var(--green)',     background: 'rgba(0,255,65,0.08)' },
    medium:  { border: '1px solid var(--amber)',      color: 'var(--amber)',     background: 'rgba(255,176,0,0.08)' },
    low:     { border: '1px solid var(--red)',        color: 'var(--red)',       background: 'rgba(255,68,68,0.08)' },
    neutral: { border: '1px solid var(--border)',     color: 'var(--text-dim)', background: 'transparent' },
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium tracking-wider uppercase ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
