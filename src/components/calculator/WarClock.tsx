'use client';

import { useTicker } from '@/lib/calculator/useTicker';
import { formatCompactUsd } from '@/lib/terminal/formatters';

interface Props {
  totalPoint: number;
  durationYears: number;
}

export function WarClock({ totalPoint, durationYears }: Props) {
  const seconds = Math.max(1, durationYears * 365 * 86400);
  const rate = totalPoint / seconds;
  const accrued = useTicker(rate, totalPoint > 0);

  if (totalPoint <= 0) return null;

  return (
    <div
      className="t-label fg-dim"
      aria-live="off"
      aria-label="War cost ticker"
      style={{ fontFamily: '"Ioskeley Mono", monospace' }}
    >
      +{formatCompactUsd(rate)}/SEC · Σ {formatCompactUsd(accrued)}
    </div>
  );
}
