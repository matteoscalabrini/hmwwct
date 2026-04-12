import { describe, it, expect } from 'vitest';
import { buildObituary, ObituaryCategory } from '../obituaries';

describe('buildObituary', () => {
  it('returns a non-empty string for military', () => {
    const result = buildObituary('military', 420e9, {
      aggressorName: 'United States',
      aggressorGdp: 25e12,
      targetName: 'Russia',
      targetGdp: 2e12,
    });
    expect(result.length).toBeGreaterThan(10);
  });

  it('returns a non-empty string for each category', () => {
    const categories: ObituaryCategory[] = ['military', 'economic', 'humanitarian', 'reconstruction'];
    const ctx = { aggressorName: 'USA', aggressorGdp: 25e12, targetName: 'Russia', targetGdp: 2e12 };
    categories.forEach((cat) => {
      expect(buildObituary(cat, 500e9, ctx).length).toBeGreaterThan(0);
    });
  });

  it('is deterministic for the same inputs', () => {
    const ctx = { aggressorName: 'USA', aggressorGdp: 25e12, targetName: 'Russia', targetGdp: 2e12 };
    const a = buildObituary('military', 420e9, ctx);
    const b = buildObituary('military', 420e9, ctx);
    expect(a).toBe(b);
  });
});
