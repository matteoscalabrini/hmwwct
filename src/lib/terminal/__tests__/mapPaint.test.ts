import { describe, it, expect } from 'vitest';
import { resolveCellTone } from '../mapPaint';

describe('resolveCellTone', () => {
  it('marks ocean as "ocean"', () => {
    expect(resolveCellTone(null, { aggressor: 'USA', target: 'RUS', glowSet: new Set() })).toBe('ocean');
  });
  it('marks aggressor as "aggressor"', () => {
    expect(resolveCellTone('USA', { aggressor: 'USA', target: 'RUS', glowSet: new Set() })).toBe('aggressor');
  });
  it('marks target as "target"', () => {
    expect(resolveCellTone('RUS', { aggressor: 'USA', target: 'RUS', glowSet: new Set() })).toBe('target');
  });
  it('marks glow countries as "glow"', () => {
    expect(resolveCellTone('ISL', { aggressor: 'USA', target: 'RUS', glowSet: new Set(['ISL']) })).toBe('glow');
  });
  it('target takes precedence over glow', () => {
    expect(resolveCellTone('RUS', { aggressor: 'USA', target: 'RUS', glowSet: new Set(['RUS']) })).toBe('target');
  });
  it('neutral otherwise', () => {
    expect(resolveCellTone('FRA', { aggressor: 'USA', target: 'RUS', glowSet: new Set() })).toBe('neutral');
  });
});
