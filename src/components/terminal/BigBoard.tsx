import { ReactNode } from 'react';

interface Props {
  parameters: ReactNode;
  theater: ReactNode;
  cost: ReactNode;
  humanToll: ReactNode;
  perPerson: ReactNode;
}

export function BigBoard({ parameters, theater, cost, humanToll, perPerson }: Props) {
  return (
    <div
      className="big-board"
      style={{
        display: 'grid',
        gap: '1px',
        padding: 'var(--s-4)',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
        gridTemplateRows: 'auto auto auto',
        gridTemplateAreas: `
          "params  theater"
          "cost    cost"
          "toll    per"
        `,
      }}
    >
      <div style={{ gridArea: 'params', overflow: 'hidden', alignSelf: 'start' }}>{parameters}</div>
      <div style={{ gridArea: 'theater', overflow: 'hidden', alignSelf: 'start' }}>{theater}</div>
      <div style={{ gridArea: 'cost', overflow: 'hidden', alignSelf: 'start' }}>{cost}</div>
      <div style={{ gridArea: 'toll', overflow: 'hidden' }}>{humanToll}</div>
      <div style={{ gridArea: 'per', overflow: 'hidden' }}>{perPerson}</div>
    </div>
  );
}
