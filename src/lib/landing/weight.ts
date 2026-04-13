export interface WeightFact {
  value: number;
  prefix: string;
  label: string;
}

export const WEIGHT_FACTS: WeightFact[] = [
  { value: 14_000_000_000_000, prefix: '$', label: 'Total cost of post-9/11 wars to the United States.' },
  { value: 110_000_000,         prefix: '',  label: 'People currently displaced by conflict worldwide.' },
  { value: 2_240_000_000_000,  prefix: '$', label: 'Global military spending in 2023.' },
  { value: 8_000_000_000,      prefix: '$', label: 'Annual budget of the WHO.' },
];
