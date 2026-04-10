import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharBar } from '../CharBar';

describe('<CharBar>', () => {
  it('renders label and display value', () => {
    render(<CharBar label="MILITARY" value={0.48} displayValue="$1.2T" />);
    expect(screen.getByText('MILITARY')).toBeInTheDocument();
    expect(screen.getByText('$1.2T')).toBeInTheDocument();
  });

  it('draws proportional filled cells', () => {
    const { container } = render(<CharBar label="X" value={0.5} displayValue="X" width={10} />);
    const filled = container.querySelector('[data-filled]')?.textContent ?? '';
    expect(filled).toHaveLength(5);
  });

  it('renders translation line when provided', () => {
    render(<CharBar label="X" value={0.5} displayValue="X" translation="the price of ..." />);
    expect(screen.getByText(/the price of/)).toBeInTheDocument();
  });
});
