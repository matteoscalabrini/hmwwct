import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerPersonPanel } from '../PerPersonPanel';

describe('<PerPersonPanel>', () => {
  it('shows awaiting when totalCost is null', () => {
    render(<PerPersonPanel totalCost={null} aggressorPop={200e6} aggressorName="TESTLAND" />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });

  it('shows awaiting when aggressorPop is undefined', () => {
    render(<PerPersonPanel totalCost={1.5e12} aggressorPop={undefined} aggressorName="TESTLAND" />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });

  it('shows hero per-capita value $11.5K for 1.5T / 200M pop', () => {
    render(<PerPersonPanel totalCost={1.5e12} aggressorPop={200e6} aggressorName="TESTLAND" />);
    // 1.5T / (200M * 0.65) ≈ $11,538 → formatCompactUsd → $11.5K
    expect(screen.getByText(/\$11\.5K/)).toBeInTheDocument();
  });

  it('shows four sector labels', () => {
    render(<PerPersonPanel totalCost={1.5e12} aggressorPop={200e6} aggressorName="TESTLAND" />);
    expect(screen.getByText(/TAX YOU'D PAY/)).toBeInTheDocument();
    expect(screen.getByText(/HEALTHCARE CUT/)).toBeInTheDocument();
    expect(screen.getByText(/EDUCATION CUT/)).toBeInTheDocument();
    expect(screen.getByText(/PENSIONS CUT/)).toBeInTheDocument();
  });

  it('shows footer line', () => {
    render(<PerPersonPanel totalCost={1.5e12} aggressorPop={200e6} aggressorName="TESTLAND" />);
    expect(screen.getByText(/YOUR SHARE OF THE BILL/)).toBeInTheDocument();
  });
});
