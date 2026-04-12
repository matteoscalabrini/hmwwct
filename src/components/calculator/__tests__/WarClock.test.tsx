import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WarClock } from '../WarClock';

describe('<WarClock>', () => {
  it('renders rate per second', () => {
    render(<WarClock totalPoint={86400000} durationYears={1} />);
    // Should show some rate per second text
    expect(screen.getByText(/\/SEC/)).toBeInTheDocument();
  });

  it('shows nothing when totalPoint is 0', () => {
    const { container } = render(<WarClock totalPoint={0} durationYears={1} />);
    expect(container.textContent).toBe('');
  });
});
