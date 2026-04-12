import { describe, it, expect } from 'vitest';
import { computeYourShare } from '../yourShare';

describe('computeYourShare', () => {
  it('computes per capita as total / (pop * 0.65)', () => {
    const result = computeYourShare(1.5e12, 200e6);
    // 1.5T / (200M * 0.65) = 1.5e12 / 130e6 ≈ 11538.46
    expect(result.perCapita).toBeCloseTo(11538.46, 0);
  });

  it('returns 4 sectors', () => {
    const result = computeYourShare(1.5e12, 200e6);
    expect(result.sectors).toHaveLength(4);
  });

  it('sector amounts sum to perCapita', () => {
    const result = computeYourShare(1.5e12, 200e6);
    const sum = result.sectors.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBeCloseTo(result.perCapita, 2);
  });

  it('sector pct values sum to 100', () => {
    const result = computeYourShare(1.5e12, 200e6);
    const totalPct = result.sectors.reduce((acc, s) => acc + s.pct, 0);
    expect(totalPct).toBe(100);
  });

  it('sectors have correct names', () => {
    const result = computeYourShare(1.5e12, 200e6);
    expect(result.sectors[0].name).toBe("TAX YOU'D PAY");
    expect(result.sectors[1].name).toBe('HEALTHCARE CUT');
    expect(result.sectors[2].name).toBe('EDUCATION CUT');
    expect(result.sectors[3].name).toBe('PENSIONS CUT');
  });
});
