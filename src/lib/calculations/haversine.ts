const R = 6371; // Earth radius in km

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * Returns distance in kilometers.
 */
export function haversineKm(
  a: [number, number],
  b: [number, number]
): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const x =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon;

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Logistics cost multiplier based on distance.
 * Each 1,000 km adds ~3% logistical overhead (RAND Corp logistics studies).
 * Capped at 2.5× (10,000+ km, e.g. US to Asia Pacific).
 */
export function logisticsMultiplier(distanceKm: number): number {
  const raw = 1 + (distanceKm / 1000) * 0.03;
  return Math.min(raw, 2.5);
}
