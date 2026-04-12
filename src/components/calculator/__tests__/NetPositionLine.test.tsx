import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetPositionLine } from '../NetPositionLine';

describe('<NetPositionLine>', () => {
  it('shows negative net position in red', () => {
    render(
      <NetPositionLine
        netPositionUsd={-1.42e12}
        breakEvenYears={null}
        totalRevenueUsd={80e9}
        hasItems={true}
      />
    );
    expect(screen.getByText(/1\.42T/)).toBeInTheDocument();
  });

  it('shows NEVER for null break-even', () => {
    render(
      <NetPositionLine
        netPositionUsd={-1e12}
        breakEvenYears={null}
        totalRevenueUsd={50e9}
        hasItems={true}
      />
    );
    expect(screen.getByText(/NEVER/)).toBeInTheDocument();
  });

  it('shows no-resources message when hasItems is false', () => {
    render(
      <NetPositionLine
        netPositionUsd={0}
        breakEvenYears={null}
        totalRevenueUsd={0}
        hasItems={false}
      />
    );
    expect(screen.getByText(/NO EXTRACTABLE RESOURCES/i)).toBeInTheDocument();
  });
});
