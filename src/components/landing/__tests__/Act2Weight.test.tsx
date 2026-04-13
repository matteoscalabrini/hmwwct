import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Act2Weight } from '../Act2Weight';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
}

beforeEach(() => {
  mockObserve.mockReset();
  mockDisconnect.mockReset();

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<Act2Weight>', () => {
  it('renders all 4 fact labels', () => {
    render(<Act2Weight />);
    expect(screen.getByText('Total cost of post-9/11 wars to the United States.')).toBeInTheDocument();
    expect(screen.getByText('People currently displaced by conflict worldwide.')).toBeInTheDocument();
    expect(screen.getByText('Global military spending in 2023.')).toBeInTheDocument();
    expect(screen.getByText('Annual budget of the WHO.')).toBeInTheDocument();
  });

  it('renders 4 fact sections', () => {
    render(<Act2Weight />);
    // Each fact section has a label paragraph
    const labels = [
      'Total cost of post-9/11 wars to the United States.',
      'People currently displaced by conflict worldwide.',
      'Global military spending in 2023.',
      'Annual budget of the WHO.',
    ];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('observes each fact section for intersection', () => {
    render(<Act2Weight />);
    expect(mockObserve).toHaveBeenCalledTimes(4);
  });

  it('with reduced-motion: shows final values immediately', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList),
    });

    render(<Act2Weight />);

    // With reduced motion, values are set to final immediately
    // The aria-label on the number divs should have the full formatted value
    expect(screen.getByLabelText('$14,000,000,000,000')).toBeInTheDocument();
    expect(screen.getByLabelText('110,000,000')).toBeInTheDocument();
    expect(screen.getByLabelText('$2,240,000,000,000')).toBeInTheDocument();
    expect(screen.getByLabelText('$8,000,000,000')).toBeInTheDocument();
  });
});
