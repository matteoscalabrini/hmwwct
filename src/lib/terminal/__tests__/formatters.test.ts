import { describe, it, expect } from 'vitest';
import { formatCompactUsd, formatFullUsd, formatCount, perCapita } from '../formatters';

describe('formatCompactUsd', () => {
  it('formats trillions with one decimal', () => {
    expect(formatCompactUsd(2_480_000_000_000)).toBe('$2.48T');
  });
  it('formats billions', () => {
    expect(formatCompactUsd(680_000_000_000)).toBe('$680B');
  });
  it('formats millions', () => {
    expect(formatCompactUsd(12_500_000)).toBe('$12.5M');
  });
  it('formats thousands', () => {
    expect(formatCompactUsd(7_400)).toBe('$7.4K');
  });
  it('formats small values plain', () => {
    expect(formatCompactUsd(12)).toBe('$12');
  });
});

describe('formatFullUsd', () => {
  it('writes the full grouped number', () => {
    expect(formatFullUsd(2_480_000_000_000)).toBe('$2,480,000,000,000');
  });
});

describe('formatCount', () => {
  it('formats millions with M suffix', () => {
    expect(formatCount(8_400_000)).toBe('8.4M');
  });
  it('formats thousands with K', () => {
    expect(formatCount(84_000)).toBe('84K');
  });
  it('formats small counts plain with commas', () => {
    expect(formatCount(142)).toBe('142');
    expect(formatCount(1_234)).toBe('1,234');
  });
});

describe('perCapita', () => {
  it('divides a total by a population', () => {
    expect(perCapita(2_480_000_000_000, 335_000_000)).toBeCloseTo(7403, 0);
  });
  it('returns 0 when population is 0', () => {
    expect(perCapita(100, 0)).toBe(0);
  });
});
