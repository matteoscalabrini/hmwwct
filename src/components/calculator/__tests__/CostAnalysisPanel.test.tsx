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
});
