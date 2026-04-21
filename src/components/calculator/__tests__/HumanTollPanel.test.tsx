import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HumanTollPanel } from '../HumanTollPanel';

describe('<HumanTollPanel>', () => {
  it('shows killed count as hero', () => {
    render(
      <HumanTollPanel
        killed={15_000}
        displaced={1_200_000}
        targetPopulation={44_000_000}
      />
    );
    expect(screen.getAllByText(/15K/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/DEAD/)).toBeInTheDocument();
  });

  it('shows displaced as secondary stat', () => {
    render(
      <HumanTollPanel
        killed={15_000}
        displaced={1_200_000}
        targetPopulation={44_000_000}
      />
    );
    expect(screen.getByText(/1\.2M DISPLACED/)).toBeInTheDocument();
  });

  it('shows awaiting when no data', () => {
    render(<HumanTollPanel killed={null} displaced={null} targetPopulation={null} />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });
});
