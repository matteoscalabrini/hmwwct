interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse terminal-panel-muted ${className}`}
      style={{ background: 'linear-gradient(90deg, rgba(18,33,27,0.72), rgba(28,51,42,0.88), rgba(18,33,27,0.72))' }}
    />
  );
}
