'use client';

import { useTypedReveal } from '@/lib/terminal/useTypedReveal';

interface TypedRevealProps {
  text: string;
  durationMs?: number;
  as?: 'span' | 'div';
  className?: string;
}

export function TypedReveal({
  text,
  durationMs = 400,
  as: Tag = 'span',
  className,
}: TypedRevealProps) {
  const shown = useTypedReveal(text, durationMs);
  return (
    <Tag className={className} aria-label={text}>
      {shown}
    </Tag>
  );
}
