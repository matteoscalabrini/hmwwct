import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const base = 'terminal-panel';
  const variants = {
    default: '',
    bordered: 'terminal-panel-strong',
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
