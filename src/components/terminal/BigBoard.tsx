import { ReactNode } from 'react';

interface Props {
  parameters: ReactNode;
  theater: ReactNode;
  cost: ReactNode;
  humanToll: ReactNode;
  perPerson: ReactNode;
  history: ReactNode;
}

export function BigBoard({ parameters, theater, cost, humanToll, perPerson, history }: Props) {
  return (
    <div
      className="big-board"
      style={{
        display: 'grid',
        gap: '24px',
        padding: 'var(--s-4)',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(480px, 2fr) minmax(360px, 1.2fr)',
        gridTemplateRows: 'auto auto',
        gridTemplateAreas: `
          "params theater cost"
          "toll   per     hist"
        `,
      }}
    >
      <div style={{ gridArea: 'params' }}>{parameters}</div>
      <div style={{ gridArea: 'theater' }}>{theater}</div>
      <div style={{ gridArea: 'cost' }}>{cost}</div>
      <div style={{ gridArea: 'toll' }}>{humanToll}</div>
      <div style={{ gridArea: 'per' }}>{perPerson}</div>
      <div style={{ gridArea: 'hist' }}>{history}</div>
    </div>
  );
}
