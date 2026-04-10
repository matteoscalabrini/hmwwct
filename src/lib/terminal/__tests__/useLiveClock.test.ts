import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveClock, formatClock } from '../useLiveClock';

describe('formatClock', () => {
  it('formats a date as YYYY.MM.DD HH:MM:SS UTC', () => {
    const d = new Date(Date.UTC(2026, 3, 9, 14, 32, 7));
    expect(formatClock(d)).toBe('2026.04.09 14:32:07 UTC');
  });
});

describe('useLiveClock', () => {
  it('returns a string and updates every second', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveClock());
    const initial = result.current;
    expect(typeof initial).toBe('string');
    act(() => { vi.advanceTimersByTime(1100); });
    expect(result.current).not.toBe('');
    vi.useRealTimers();
  });
});
