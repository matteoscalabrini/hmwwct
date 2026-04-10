import { splitBar } from '@/lib/terminal/charBarMath';

interface CharBarProps {
  label: string;
  value: number;
  displayValue: string;
  width?: number;
  tone?: 'default' | 'alert' | 'phosphor-bright';
  translation?: string;
  percent?: number;
}

export function CharBar({
  label,
  value,
  displayValue,
  width = 20,
  tone = 'default',
  translation,
  percent,
}: CharBarProps) {
  const { filled, empty } = splitBar(value, width);
  const pct = percent ?? Math.round(value * 100);

  const fillColor =
    tone === 'alert'            ? 'var(--alert)' :
    tone === 'phosphor-bright'  ? 'var(--phosphor)' :
                                  'var(--phosphor-d)';

  return (
    <div className="t-data" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(7ch, 14ch) 1fr min-content min-content',
          gap: 'var(--s-3)',
          alignItems: 'baseline',
        }}
      >
        <span className="t-label fg-dim">{label}</span>
        <span style={{ whiteSpace: 'nowrap' }}>
          <span data-filled style={{ color: fillColor }}>{'█'.repeat(filled)}</span>
          <span className="fg-mute">{'░'.repeat(empty)}</span>
        </span>
        <span className="fg">{displayValue}</span>
        <span className="fg-dim">{pct}%</span>
      </div>
      {translation && (
        <div className="t-label fg-dim" style={{ paddingLeft: 'calc(14ch + var(--s-3))' }}>
          {translation}
        </div>
      )}
    </div>
  );
}
