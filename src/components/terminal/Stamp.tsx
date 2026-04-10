import { ReactNode } from 'react';

interface StampProps {
  children: ReactNode;
}

export function Stamp({ children }: StampProps) {
  const label = typeof children === 'string' ? children.toUpperCase() : children;
  return (
    <span
      className="t-label fg-dim"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25em' }}
    >
      <span aria-hidden="true">┌─</span>
      <span> {label} </span>
      <span aria-hidden="true">─┐</span>
    </span>
  );
}
