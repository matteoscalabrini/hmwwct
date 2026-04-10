import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkey } from '../useHotkey';

describe('useHotkey', () => {
  it('calls handler on matching keydown', () => {
    const handler = vi.fn();
    renderHook(() => useHotkey('c', handler));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores keydown inside an input', () => {
    const handler = vi.fn();
    renderHook(() => useHotkey('c', handler));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
    input.remove();
  });

  it('is case-insensitive', () => {
    const handler = vi.fn();
    renderHook(() => useHotkey('c', handler));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'C' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
