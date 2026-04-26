import type { CSSProperties, ReactNode } from 'react';

interface Props {
  parameters: ReactNode;
  theater: ReactNode;
  cost: ReactNode;
  humanToll: ReactNode;
  perPerson: ReactNode;
}

const cellStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
};

export function BigBoard({ parameters, theater, cost, humanToll, perPerson }: Props) {
  return (
    <div
      className="big-board"
      style={{
        display: 'grid',
        gap: 'var(--s-5)',
        padding: 'var(--s-5)',
        gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(360px, 1.35fr) minmax(320px, 1fr)',
        gridTemplateRows: 'auto auto auto',
        gridTemplateAreas: `
          "params  cost    cost"
          "theater theater toll"
          "theater theater per"
        `,
        alignItems: 'stretch',
      }}
    >
      <div className="big-board__cell" style={{ ...cellStyle, gridArea: 'params' }}>{parameters}</div>
      <div className="big-board__cell" style={{ ...cellStyle, gridArea: 'theater' }}>{theater}</div>
      <div className="big-board__cell" style={{ ...cellStyle, gridArea: 'cost' }}>{cost}</div>
      <div className="big-board__cell" style={{ ...cellStyle, gridArea: 'toll' }}>{humanToll}</div>
      <div className="big-board__cell big-board__stack" style={{ ...cellStyle, gridArea: 'per' }}>{perPerson}</div>
    </div>
  );
}
