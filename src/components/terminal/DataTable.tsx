import { ReactNode } from 'react';

interface DataTableProps {
  children: ReactNode;
}

export function DataTable({ children }: DataTableProps) {
  return (
    <div
      className="t-data"
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content min-content 1fr',
        columnGap: 'var(--s-3)',
        rowGap: 'var(--s-2)',
        alignItems: 'baseline',
      }}
    >
      {children}
    </div>
  );
}

interface RowProps {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'alert' | 'accent';
  highlight?: boolean;
  footnote?: string;
}

function Row({ label, value, tone = 'default', highlight = false, footnote }: RowProps) {
  const inverted = highlight || tone === 'alert';
  const bg = inverted ? 'var(--accent)' : 'transparent';
  const fg = inverted ? 'var(--bg)' : undefined;
  const valueColor =
    tone === 'accent' ? 'var(--accent)' :
                          'var(--fg)';

  return (
    <>
      <span
        data-tone={tone}
        className="t-label fg-dim"
        style={{ background: bg, color: fg }}
      >
        {label}
      </span>
      <span aria-hidden="true" className="fg-mute">│</span>
      <span
        data-tone={tone}
        style={{ color: fg ?? valueColor, background: bg, padding: inverted ? '0 4px' : undefined }}
      >
        {value}
      </span>
      {footnote && (
        <span style={{ gridColumn: '1 / -1', fontStyle: 'italic' }} className="t-label fg-dim">
          {footnote}
        </span>
      )}
    </>
  );
}

DataTable.Row = Row;
