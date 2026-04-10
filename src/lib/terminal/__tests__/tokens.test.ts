import { describe, it, expect } from 'vitest';
import { palette } from '../palette';
import { typography } from '../typography';

describe('palette', () => {
  it('exposes OLED black background', () => {
    expect(palette.bg).toBe('#000000');
  });

  it('exposes phosphor accent', () => {
    expect(palette.phosphor).toBe('#4aff7a');
  });

  it('exposes alert red', () => {
    expect(palette.alert).toBe('#ff3b3b');
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
