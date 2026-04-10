import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypedReveal } from '../useTypedReveal';

describe('useTypedReveal', () => {
  it('starts empty and reveals characters over time', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypedReveal('HELLO', 100));
    expect(result.current).toBe('');
    act(() => { vi.advanceTimersByTime(20); });
    expect(result.current.length).toBeGreaterThan(0);
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('HELLO');
    vi.useRealTimers();
  });

  it('respects reduced motion by revealing instantly', () => {
    const mediaQueryList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQueryList as unknown as MediaQueryList);
    const { result } = renderHook(() => useTypedReveal('HELLO', 400));
    expect(result.current).toBe('HELLO');
  });
});
