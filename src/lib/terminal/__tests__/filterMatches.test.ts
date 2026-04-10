import { describe, it, expect } from 'vitest';
import { filterMatches } from '../filterMatches';

const OPTIONS = [
  { value: 'USA', label: 'United States' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'UKR', label: 'Ukraine' },
  { value: 'URY', label: 'Uruguay' },
  { value: 'JPN', label: 'Japan' },
];

describe('filterMatches', () => {
  it('returns all options for empty query', () => {
    expect(filterMatches(OPTIONS, '')).toHaveLength(5);
  });

  it('is case-insensitive', () => {
    const r = filterMatches(OPTIONS, 'uni');
    expect(r.map(o => o.value)).toEqual(['USA', 'GBR']);
  });

  it('matches prefix of any word in the label', () => {
    const r = filterMatches(OPTIONS, 'uk');
    expect(r.map(o => o.value)).toContain('UKR');
  });

  it('matches on the ISO value too', () => {
    const r = filterMatches(OPTIONS, 'JPN');
    expect(r.map(o => o.value)).toEqual(['JPN']);
  });

  it('limits to top 8 results', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ value: `X${i}`, label: `Xland ${i}` }));
    expect(filterMatches(many, 'x')).toHaveLength(8);
  });
});
