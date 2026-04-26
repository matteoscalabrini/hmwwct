import { describe, expect, it } from 'vitest';
import type { Country } from '@/types';
import { calculateHumanitarianCost } from '../humanitarian';

const usa: Country = {
  code: 'USA',
  code2: 'US',
  name: 'United States',
  flag: '',
  flagSvg: '',
  region: 'Americas',
  subregion: 'Northern America',
  latlng: [38, -97],
  area: 9_833_517,
  gdp: 27_000_000_000_000,
  population: 335_000_000,
  militaryBudgetUsd: 916_000_000_000,
  militaryPctGdp: 3.42,
  militaryPersonnel: 1_395_350,
  tradeGdpPct: 25,
  goldReservesUsd: null,
  dataYear: 2024,
  hasStaticFallback: false,
};

const iran: Country = {
  code: 'IRN',
  code2: 'IR',
  name: 'Iran',
  flag: '',
  flagSvg: '',
  region: 'Asia',
  subregion: 'Southern Asia',
  latlng: [32, 53],
  area: 1_648_195,
  gdp: 462_000_000_000,
  population: 89_000_000,
  militaryBudgetUsd: 10_000_000_000,
  militaryPctGdp: 2.1,
  militaryPersonnel: 610_000,
  tradeGdpPct: 48,
  goldReservesUsd: null,
  dataYear: 2024,
  hasStaticFallback: false,
};

describe('calculateHumanitarianCost', () => {
  it('treats air_campaign displacementMultiplier as an observed population share', () => {
    const { humanToll, category } = calculateHumanitarianCost({
      aggressor: usa,
      target: iran,
      scenario: 'air_campaign',
    });

    expect(humanToll.displacedPersonsPoint).toBe(3_560_000);
    expect(category.methodology).toContain('4.0% of population');
  });

  it('keeps precision_strike displacement dampened by historical displacement ratios', () => {
    const { humanToll, category } = calculateHumanitarianCost({
      aggressor: usa,
      target: iran,
      scenario: 'precision_strike',
    });

    expect(humanToll.displacedPersonsPoint).toBe(71_200);
    expect(category.methodology).toContain('0.1% of population');
  });
});
