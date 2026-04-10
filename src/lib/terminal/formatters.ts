function groupDigits(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const UNITS: [number, string, number][] = [
  [1e12, 'T', 2],
  [1e9,  'B', 0],
  [1e6,  'M', 1],
  [1e3,  'K', 1],
];

export function formatCompactUsd(n: number): string {
  if (n === 0) return '$0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  for (const [threshold, suffix, decimals] of UNITS) {
    if (abs >= threshold) {
      const val = abs / threshold;
      const str = decimals === 0 ? val.toFixed(0) : val.toFixed(decimals).replace(/\.?0+$/, '');
      return `${sign}$${str}${suffix}`;
    }
  }
  return `${sign}$${Math.round(abs)}`;
}

export function formatFullUsd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${groupDigits(Math.round(Math.abs(n)))}`;
}

export function formatCount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 10_000) return `${Math.round(abs / 1e3)}K`;
  return groupDigits(abs);
}

export function perCapita(total: number, population: number): number {
  if (population <= 0) return 0;
  return total / population;
}
