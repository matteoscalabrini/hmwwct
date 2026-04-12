export interface ShareBreakdown {
  perCapita: number;
  sectors: { name: string; amount: number; pct: number }[];
}

const SECTORS = [
  { name: "TAX YOU'D PAY", weight: 0.02 },
  { name: 'HEALTHCARE CUT', weight: 0.07 },
  { name: 'EDUCATION CUT', weight: 0.05 },
  { name: 'PENSIONS CUT', weight: 0.12 },
];

export function computeYourShare(totalCost: number, aggressorPop: number): ShareBreakdown {
  const adultPop = aggressorPop * 0.65;
  const perCapita = totalCost / adultPop;
  const totalWeight = SECTORS.reduce((s, x) => s + x.weight, 0);
  const sectors = SECTORS.map((s) => ({
    name: s.name,
    amount: perCapita * (s.weight / totalWeight),
    pct: Math.round((s.weight / totalWeight) * 100),
  }));
  return { perCapita, sectors };
}
