import tradeData from '@/lib/data/bilateral-trade-shares.json';
import sanctionsData from '@/lib/data/sanctions-regimes.json';

type GlowTone = 'glow-high' | 'glow-med' | 'glow-low';

const SANCTIONING_BLOCS = new Set(['USA', 'GBR', 'FRA', 'DEU', 'JPN', 'CAN', 'AUS', 'ITA']);

/**
 * Find all trade partners of a country and their bilateral trade volumes.
 */
function getTradePartners(iso: string): Map<string, number> {
  const pairs = (tradeData as { pairs: Record<string, { tradeVolumeUsd: number }> }).pairs;
  const partners = new Map<string, number>();

  for (const [key, value] of Object.entries(pairs)) {
    const parts = key.split('-');
    if (parts.length !== 2) continue;
    const [a, b] = parts;
    if (a === iso) {
      partners.set(b, value.tradeVolumeUsd);
    } else if (b === iso) {
      partners.set(a, value.tradeVolumeUsd);
    }
  }

  return partners;
}

/**
 * Build a trade impact overlay for a conflict between aggressor and target.
 * Countries are bucketed into glow-high / glow-med / glow-low based on their
 * combined bilateral trade volume with either party.
 */
export function buildTradeOverlay(
  aggressor: string,
  target: string,
): Map<string, GlowTone> {
  const aggressorPartners = getTradePartners(aggressor);
  const targetPartners = getTradePartners(target);

  // Merge: sum volumes for countries that trade with either/both
  const combined = new Map<string, number>();
  for (const [iso, vol] of aggressorPartners) {
    if (iso === aggressor || iso === target) continue;
    combined.set(iso, (combined.get(iso) ?? 0) + vol);
  }
  for (const [iso, vol] of targetPartners) {
    if (iso === aggressor || iso === target) continue;
    combined.set(iso, (combined.get(iso) ?? 0) + vol);
  }

  if (combined.size === 0) return new Map();

  // Sort by volume descending to determine thirds
  const sorted = [...combined.entries()].sort((a, b) => b[1] - a[1]);
  const n = sorted.length;
  const thirdSize = Math.ceil(n / 3);

  const result = new Map<string, GlowTone>();
  sorted.forEach(([iso], idx) => {
    if (idx < thirdSize) {
      result.set(iso, 'glow-high');
    } else if (idx < thirdSize * 2) {
      result.set(iso, 'glow-med');
    } else {
      result.set(iso, 'glow-low');
    }
  });

  return result;
}

/**
 * Build a sanctions reach overlay for a given aggressor.
 * G7+ sanctioning blocs get glow-high; aggressor's trade partners get glow-low.
 * Returns empty map if the aggressor has no sanctions entry.
 */
export function buildSanctionsOverlay(aggressor: string): Map<string, GlowTone> {
  const countries = (sanctionsData as { countries: Record<string, unknown> }).countries;

  if (!(aggressor in countries)) {
    return new Map();
  }

  const result = new Map<string, GlowTone>();

  // Sanctioning blocs get glow-high
  for (const iso of SANCTIONING_BLOCS) {
    if (iso !== aggressor) {
      result.set(iso, 'glow-high');
    }
  }

  // Trade partners of the aggressor get glow-low (sanctions ripple)
  const aggressorPartners = getTradePartners(aggressor);
  for (const iso of aggressorPartners.keys()) {
    if (iso === aggressor) continue;
    // Don't override glow-high entries
    if (!result.has(iso)) {
      result.set(iso, 'glow-low');
    }
  }

  return result;
}
