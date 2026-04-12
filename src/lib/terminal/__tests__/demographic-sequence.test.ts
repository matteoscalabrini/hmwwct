import { describe, it, expect } from 'vitest';
import { buildSequence } from '@/lib/terminal/demographic-sequence';

describe('buildSequence', () => {
  it('is deterministic — two calls with same args return identical arrays', () => {
    const a = buildSequence(100, 0.25, 0.01);
    const b = buildSequence(100, 0.25, 0.01);
    expect(a).toEqual(b);
  });

  it('returns a Uint8Array of the requested length', () => {
    const seq = buildSequence(100, 0.25, 0.01);
    expect(seq).toBeInstanceOf(Uint8Array);
    expect(seq.length).toBe(100);
  });

  it('produces approximately the requested child ratio', () => {
    const seq = buildSequence(100, 0.25, 0.01);
    const children = Array.from(seq).filter((v) => v === 1).length;
    // Allow ±10 units of tolerance on a 100-element array
    expect(children).toBeGreaterThanOrEqual(15);
    expect(children).toBeLessThanOrEqual(35);
  });

  it('produces approximately the requested casualty ratio', () => {
    const seq = buildSequence(100, 0.25, 0.01);
    const casualties = Array.from(seq).filter((v) => v === 2).length;
    // 1% of 100 = 1 — allow 0–5 range
    expect(casualties).toBeGreaterThanOrEqual(0);
    expect(casualties).toBeLessThanOrEqual(5);
  });

  it('only contains values 0, 1, or 2', () => {
    const seq = buildSequence(200, 0.3, 0.05);
    for (const v of seq) {
      expect(v === 0 || v === 1 || v === 2).toBe(true);
    }
  });

  it('returns empty array for total=0', () => {
    const seq = buildSequence(0, 0.25, 0.01);
    expect(seq.length).toBe(0);
  });
});
