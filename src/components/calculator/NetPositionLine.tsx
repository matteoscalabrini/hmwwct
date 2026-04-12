import { AsciiRule } from '@/components/terminal/AsciiRule';
import { formatCompactUsd } from '@/lib/terminal/formatters';

interface Props {
  netPositionUsd: number;
  breakEvenYears: number | null;
  totalRevenueUsd: number;
  hasItems: boolean;
}

export function NetPositionLine({ netPositionUsd, breakEvenYears, totalRevenueUsd, hasItems }: Props) {
  if (!hasItems) {
    return (
      <div>
        <AsciiRule />
        <p className="t-label fg-dim" style={{ marginTop: 'var(--s-2)' }}>
          &gt; NO EXTRACTABLE RESOURCES IDENTIFIED
        </p>
      </div>
    );
  }

  const isLoss = netPositionUsd < 0;
  const color = isLoss ? 'var(--alert)' : 'var(--phosphor)';
  const breakEvenText = breakEvenYears === null
    ? 'NEVER'
    : breakEvenYears > 500
    ? 'NEVER (>500 YRS)'
    : `${breakEvenYears} YEARS`;

  return (
    <div>
      <AsciiRule />
      <div style={{ marginTop: 'var(--s-2)', display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
        <div className="t-label fg-dim">NET POSITION</div>
        <div className="t-data" style={{ color, fontWeight: 700 }}>
          {isLoss ? '' : '+'}{formatCompactUsd(netPositionUsd)} · BREAK-EVEN: {breakEvenText}
        </div>
        {totalRevenueUsd > 0 && (
          <div className="t-label fg-dim" style={{ fontStyle: 'italic' }}>
            Best-case revenue: {formatCompactUsd(totalRevenueUsd)}. Even best-case {isLoss ? 'loses money' : 'barely breaks even'}.
          </div>
        )}
      </div>
    </div>
  );
}
