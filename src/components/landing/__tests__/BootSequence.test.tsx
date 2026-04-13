import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { BootSequence } from '../BootSequence';

describe('<BootSequence>', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    // Default: no reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('renders the SKIP button', () => {
    render(<BootSequence onComplete={() => {}} />);
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('calls onComplete and sets sessionStorage when SKIP is clicked', () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);
    // Use fireEvent (not userEvent) to avoid async timer issues
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('hmwwct.booted')).toBe('1');
  });

  it('with reduced-motion: shows all lines instantly and calls onComplete', () => {
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

    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    // All lines visible immediately; onComplete fires after 100ms
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('HMWWCT v3.0 — HOW MUCH WOULD A WAR COST THERE')).toBeInTheDocument();
    expect(screen.getByText('> READY.')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('hmwwct.booted')).toBe('1');
  });

  it('sequences through lines and eventually calls onComplete', () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    // Advance 200ms at a time; each step triggers a re-render and the next useEffect
    // 12 lines * 200ms + 500ms final = ~2900ms total, so 20 steps of 200ms is safe
    for (let i = 0; i < 20; i++) {
      act(() => {
        vi.advanceTimersByTime(200);
      });
    }

    expect(screen.getByText('> READY.')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('hmwwct.booted')).toBe('1');
  });
});
