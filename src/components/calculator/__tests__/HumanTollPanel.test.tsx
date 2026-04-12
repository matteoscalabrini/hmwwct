import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HumanTollPanel } from '../HumanTollPanel';

describe('<HumanTollPanel>', () => {
  it('shows displaced count as hero', () => {
    render(
      <HumanTollPanel
        displaced={1_200_000}
        targetPopulation={44_000_000}
      />
    );
    expect(screen.getByText(/1\.2M/)).toBeInTheDocument();
    expect(screen.getByText(/DISPLACED/)).toBeInTheDocument();
  });

  it('shows awaiting when no data', () => {
    render(<HumanTollPanel displaced={null} targetPopulation={null} />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });
});
