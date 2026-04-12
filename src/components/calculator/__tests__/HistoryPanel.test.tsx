import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryPanel } from '../HistoryPanel';

describe('<HistoryPanel>', () => {
  it('shows awaiting when totalCost is null', () => {
    render(<HistoryPanel totalCost={null} />);
    expect(screen.getByText(/AWAITING/)).toBeInTheDocument();
  });

  it('shows THIS WAR bar when totalCost is provided', () => {
    render(<HistoryPanel totalCost={2e12} />);
    expect(screen.getByText('THIS WAR')).toBeInTheDocument();
  });

  it('shows at least 6 historical war labels', () => {
    render(<HistoryPanel totalCost={2e12} />);
    // All 6 historical wars should appear
    expect(screen.getByText(/WWII/)).toBeInTheDocument();
    expect(screen.getByText(/VIETNAM/)).toBeInTheDocument();
    expect(screen.getByText(/IRAQ/)).toBeInTheDocument();
    expect(screen.getByText(/AFGHANISTAN/)).toBeInTheDocument();
    expect(screen.getByText(/KOREAN/)).toBeInTheDocument();
    expect(screen.getByText(/GULF/)).toBeInTheDocument();
  });

  it('renders 7 CharBars total (6 historical + 1 THIS WAR)', () => {
    render(<HistoryPanel totalCost={2e12} />);
    // Each CharBar renders filled blocks — look for data-filled elements
    const filledElements = document.querySelectorAll('[data-filled]');
    expect(filledElements.length).toBe(7);
  });
});
