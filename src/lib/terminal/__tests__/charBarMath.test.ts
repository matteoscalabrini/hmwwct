import { describe, it, expect } from 'vitest';
import { splitBar } from '../charBarMath';

describe('splitBar', () => {
  it('returns all filled when value is 1', () => {
    expect(splitBar(1, 10)).toEqual({ filled: 10, empty: 0 });
  });

  it('returns all empty when value is 0', () => {
    expect(splitBar(0, 10)).toEqual({ filled: 0, empty: 10 });
  });

  it('rounds to nearest cell', () => {
    expect(splitBar(0.48, 10)).toEqual({ filled: 5, empty: 5 });
    expect(splitBar(0.44, 10)).toEqual({ filled: 4, empty: 6 });
  });

  it('clamps out-of-range values', () => {
    expect(splitBar(-0.1, 10)).toEqual({ filled: 0, empty: 10 });
    expect(splitBar(1.5, 10)).toEqual({ filled: 10, empty: 0 });
  });
});
