import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OperationsTheaterPanel } from '../OperationsTheaterPanel';

vi.mock('@/lib/data/map-grid.json', () => ({
  default: [
    [null, null],
    ['USA', 'RUS'],
  ],
}));

describe('<OperationsTheaterPanel>', () => {
  it('renders the panel with map', () => {
    render(
      <OperationsTheaterPanel
        aggressor="USA"
        target="RUS"
        countriesByIso={{ USA: { name: 'United States', population: 335000000 }, RUS: { name: 'Russia', population: 144000000 } }}
      />
    );
    expect(screen.getByText(/OPERATIONS THEATER/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map/)).toBeInTheDocument();
  });

  it('renders inspector strip with default message', () => {
    render(
      <OperationsTheaterPanel
        aggressor="USA"
        target="RUS"
        countriesByIso={{}}
      />
    );
    expect(screen.getByText(/HOVER/i)).toBeInTheDocument();
  });
});
