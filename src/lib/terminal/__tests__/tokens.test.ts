import { describe, it, expect } from 'vitest';
import { palette } from '../palette';
import { typography } from '../typography';

describe('palette', () => {
  it('exposes OLED black background', () => {
    expect(palette.bg).toBe('#000000');
  });

  it('exposes pure white accent', () => {
    expect(palette.accent).toBe('#ffffff');
  });

  it('is strictly monochrome (all channels equal)', () => {
    const hexes = [palette.fg, palette.fgDim, palette.fgMute, palette.accent, palette.accentD, palette.alert];
    for (const hex of hexes) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      expect(r).toBe(g);
      expect(g).toBe(b);
    }
  });
});

describe('typography', () => {
  it('has exactly 5 sizes', () => {
    expect(Object.keys(typography.size)).toHaveLength(5);
  });

  it('hero is 96px', () => {
    expect(typography.size.hero).toBe(96);
  });

  it('names the two fonts', () => {
    expect(typography.family.display).toBe('Departure Mono');
    expect(typography.family.body).toBe('Ioskeley Mono');
  });
});
