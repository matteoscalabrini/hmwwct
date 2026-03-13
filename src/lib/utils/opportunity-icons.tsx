import type { LucideIcon } from 'lucide-react';
import {
  BedDouble,
  Droplets,
  Heart,
  School,
  Soup,
  Sun,
  Syringe,
  Toilet,
  TreePine,
  Users,
  Stethoscope,
} from 'lucide-react';

export const OPPORTUNITY_ICONS: Record<string, LucideIcon> = {
  BedDouble,
  Droplets,
  Heart,
  School,
  Soup,
  Sun,
  Syringe,
  Toilet,
  TreePine,
  Users,
  Stethoscope,
};

export const OPPORTUNITY_ID_ICON_FALLBACKS: Record<string, LucideIcon> = {
  hospital_beds: BedDouble,
  nurses: Stethoscope,
  clean_water: Droplets,
  sanitation_access: Toilet,
  food_support: Soup,
  vaccines: Syringe,
  solar_homes: Sun,
  climate_forests: TreePine,
  primary_schools: School,
};
