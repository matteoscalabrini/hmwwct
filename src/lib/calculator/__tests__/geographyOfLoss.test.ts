import { describe, it, expect } from 'vitest';
import { buildTradeOverlay, buildSanctionsOverlay } from '../geographyOfLoss';

describe('buildTradeOverlay', () => {
  it('returns a Map with at least 3 entries for USA-CHN', () => {
    const result = buildTradeOverlay('USA', 'CHN');
    expect(result.size).toBeGreaterThanOrEqual(3);
  });

  it('does not include the aggressor or target', () => {
    const result = buildTradeOverlay('USA', 'CHN');
    expect(result.has('USA')).toBe(false);
    expect(result.has('CHN')).toBe(false);
  });

  it('all values are valid glow tones', () => {
    const result = buildTradeOverlay('USA', 'CHN');
    const validTones = new Set(['glow-high', 'glow-med', 'glow-low']);
    for (const [, tone] of result) {
      expect(validTones.has(tone)).toBe(true);
    }
  });

  it('returns entries for partners that trade with USA', () => {
    // CAN-USA pair exists in data
    const result = buildTradeOverlay('USA', 'CHN');
    // CAN trades with USA so should appear
    expect(result.has('CAN')).toBe(true);
  });

  it('works symmetrically for aggressor and target', () => {
    const r1 = buildTradeOverlay('RUS', 'UKR');
    expect(r1.size).toBeGreaterThanOrEqual(1);
    expect(r1.has('RUS')).toBe(false);
    expect(r1.has('UKR')).toBe(false);
  });
});

describe('buildSanctionsOverlay', () => {
  it('returns glow-high for G7+ countries when aggressor is sanctioned', () => {
    const result = buildSanctionsOverlay('RUS');
    // USA should be glow-high as a sanctioning bloc member
    expect(result.get('USA')).toBe('glow-high');
    expect(result.get('GBR')).toBe('glow-high');
  });

  it('returns empty map for unsanctioned aggressors', () => {
    // Use a country not in sanctions data
    const result = buildSanctionsOverlay('NZL');
    expect(result.size).toBe(0);
  });

  it('does not include the aggressor itself', () => {
    const result = buildSanctionsOverlay('IRN');
    expect(result.has('IRN')).toBe(false);
  });

  it('returns glow-low for trade partners (ripple effect)', () => {
    // RUS trades with many countries, they should be glow-low
    const result = buildSanctionsOverlay('RUS');
    // check that at least some non-G7 entries are glow-low
    const lowEntries = [...result.values()].filter(v => v === 'glow-low');
    expect(lowEntries.length).toBeGreaterThan(0);
  });
});
