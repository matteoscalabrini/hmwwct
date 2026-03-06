import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const base = 'rounded-lg bg-white';
  const variants = {
    default: 'shadow-sm',
    bordered: 'border border-stone-200',
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
