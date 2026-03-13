export const STRONG_OPPORTUNITY_IDS = [
  'hospital_beds',
  'nurses',
  'clean_water',
  'sanitation_access',
  'food_support',
  'vaccines',
  'climate_forests',
] as const;

export const STRONG_OPPORTUNITY_ID_SET = new Set<string>(STRONG_OPPORTUNITY_IDS);
