import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsteadPanel } from '../InsteadPanel';

describe('<InsteadPanel>', () => {
  it('shows awaiting when totalCost is null', () => {
    render(<InsteadPanel totalCost={null} />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });

  it('shows at least 4 item labels when totalCost is 1e12', () => {
    render(<InsteadPanel totalCost={1e12} />);
    // opportunity-costs.json has labels like "Primary schools built", "Hospital beds (1 year)", etc.
    // Check that multiple labels from the JSON appear
    const labels = screen.getAllByText(/schools|hospital|nurses|water|vaccine|meals|solar|forest/i);
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  it('shows the header prompt text', () => {
    render(<InsteadPanel totalCost={1e12} />);
    expect(screen.getByText(/INSTEAD OF THIS WAR/)).toBeInTheDocument();
  });

  it('shows panel title INSTEAD', () => {
    render(<InsteadPanel totalCost={1e12} />);
    expect(screen.getByText('INSTEAD')).toBeInTheDocument();
  });
});
