import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostAnalysisPanel } from '../CostAnalysisPanel';

const mockResult = {
  total: { min: 500e9, max: 2000e9, point: 1740e9 },
  breakdown: {
    military: { min: 100e9, max: 500e9, point: 420e9 },
    economic: { min: 200e9, max: 800e9, point: 600e9 },
    humanitarian: { min: 50e9, max: 300e9, point: 180e9 },
    reconstruction: { min: 100e9, max: 500e9, point: 340e9 },
  },
  duration: { min: 0.5, max: 3, point: 1.5, unit: 'years' },
};

const apiShapedResult = {
  total: { min: 500e9, max: 2000e9, point: 1740e9 },
  breakdown: {
    military: { amountMin: 100e9, amountMax: 500e9, amount: 420e9 },
    economic: { amountMin: 200e9, amountMax: 800e9, amount: 600e9 },
    humanitarian: { amountMin: 50e9, amountMax: 300e9, amount: 180e9 },
    reconstruction: { amountMin: 100e9, amountMax: 500e9, amount: 340e9 },
    armaments: { amountMin: 80e9, amountMax: 420e9, amount: 200e9 },
  },
  duration: { min: 0.5, max: 3, point: 1.5, unit: 'years' },
};

describe('<CostAnalysisPanel>', () => {
  it('shows awaiting message when no result', () => {
    render(<CostAnalysisPanel result={null} />);
    expect(screen.getByText(/AWAITING PARAMETERS/)).toBeInTheDocument();
  });

  it('shows hero number when result present', () => {
    render(<CostAnalysisPanel result={mockResult} />);
    expect(screen.getByText(/\$1\.74T/)).toBeInTheDocument();
  });

  it('shows four breakdown rows', () => {
    render(<CostAnalysisPanel result={mockResult} />);
    expect(screen.getByText('MILITARY')).toBeInTheDocument();
    expect(screen.getByText('ECONOMIC')).toBeInTheDocument();
    expect(screen.getByText('HUMANITARIAN')).toBeInTheDocument();
    expect(screen.getByText('RECONSTRUCTION')).toBeInTheDocument();
  });

  it('formats API-shaped category amounts without NaN', () => {
    render(<CostAnalysisPanel result={apiShapedResult} />);
    expect(screen.queryByText(/\$NaN/)).not.toBeInTheDocument();
    expect(screen.getByText('$420B')).toBeInTheDocument();
    expect(screen.getByText('$180B')).toBeInTheDocument();
    expect(screen.getByText('ARMAMENTS')).toBeInTheDocument();
    expect(screen.getByText('$200B')).toBeInTheDocument();
  });

  it('separates direct costs from systemic economic impact', () => {
    render(<CostAnalysisPanel result={apiShapedResult} />);
    expect(screen.getByText('DIRECT COST COMPONENTS')).toBeInTheDocument();
    expect(screen.getByText('SEPARATE SYSTEMIC IMPACT')).toBeInTheDocument();
  });
});
