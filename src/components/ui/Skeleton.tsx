interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: 'var(--green-faint)', border: '1px solid var(--border)' }}
    />
  );
}
