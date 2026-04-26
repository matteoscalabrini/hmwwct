import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Act1Boot } from '../Act1Boot';

describe('<Act1Boot>', () => {
  it('renders the hero heading text', () => {
    render(<Act1Boot />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('HOW MUCH');
    expect(heading).toHaveTextContent('WOULD A WAR');
    expect(heading).toHaveTextContent('COST THERE?');
  });

  it('renders the subheading', () => {
    render(<Act1Boot />);
    expect(screen.getByText(/TERMINAL FOR COUNTING WHAT WARS DESTROY/)).toBeInTheDocument();
  });

  it('renders the scroll hint with a data/calculator destination', () => {
    render(<Act1Boot />);
    const cue = screen.getByRole('link', { name: /more data and the calculator/i });
    expect(cue).toHaveAttribute('href', '#weight-data');
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/DATA \+ CALCULATOR/)).toBeInTheDocument();
  });
});
