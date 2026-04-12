import { describe, it, expect } from 'vitest';
import { createSpriteSheet } from '@/lib/terminal/sprite-factory';

describe('createSpriteSheet', () => {
  it('returns an OffscreenCanvas with dimensions 12×5', () => {
    if (typeof OffscreenCanvas === 'undefined') return;

    const sheet = createSpriteSheet({
      adult: '#4aff7a',
      child: '#2a6644',
      casualty: '#ff4444',
    });

    expect(sheet).toBeInstanceOf(OffscreenCanvas);
    expect(sheet.width).toBe(12);
    expect(sheet.height).toBe(5);
  });

  it('does not throw when OffscreenCanvas is available', () => {
    if (typeof OffscreenCanvas === 'undefined') return;

    expect(() =>
      createSpriteSheet({
        adult: '#4aff7a',
        child: '#2a6644',
        casualty: '#ff4444',
      })
    ).not.toThrow();
  });
});
