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
  tone?: 'default' | 'alert' | 'phosphor';
  highlight?: boolean;
}

function Row({ label, value, tone = 'default', highlight = false }: RowProps) {
  const valueColor =
    tone === 'alert'    ? 'var(--alert)' :
    tone === 'phosphor' ? 'var(--phosphor)' :
                          'var(--fg)';
  const bg = highlight ? 'var(--phosphor)' : 'transparent';
  const fg = highlight ? 'var(--bg)' : undefined;

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
        style={{ color: highlight ? 'var(--bg)' : valueColor, background: bg }}
      >
        {value}
      </span>
    </>
  );
}

DataTable.Row = Row;
