import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadingProgress } from '../ReadingProgress';

beforeEach(() => {
  // Mock scroll/document properties
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true, writable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<ReadingProgress>', () => {
  it('renders a progressbar role element', () => {
    render(<ReadingProgress />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has aria-label "Reading progress"', () => {
    render(<ReadingProgress />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Reading progress');
  });

  it('has aria-valuenow attribute', () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow');
  });

  it('renders the percentage text', () => {
    render(<ReadingProgress />);
    // Should show "0%" initially (scrollY=0)
    expect(screen.getByRole('progressbar').textContent).toMatch(/\d+%/);
  });

  it('renders a block bar string containing block chars', () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    // Bar should contain either filled or empty block chars
    expect(bar.textContent).toMatch(/[█░]/);
  });
});
