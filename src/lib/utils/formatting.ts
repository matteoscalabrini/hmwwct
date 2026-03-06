/**
 * Format a USD dollar amount compactly (e.g. $1.2T, $450B, $3.2M, $500K)
 */
export function formatCurrency(value: number, prefix = '$'): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${prefix}${abs.toFixed(0)}`;
}

/**
 * Format a range of USD values (e.g. "$1.2T – $2.1T")
 */
export function formatCurrencyRange(min: number, max: number): string {
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

/**
 * Format a large number in English words (e.g. "1.2 million", "450 thousand")
 */
export function formatLargeNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(1)} billion`;
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(1)} million`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(0)} thousand`;
  return abs.toFixed(0);
}

/**
 * Format a number with commas (e.g. 1,234,567)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/**
 * Format a percentage (e.g. "3.4%")
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a duration in years (e.g. "~10 years", "~3 months")
 */
export function formatDuration(years: number): string {
  if (years < 1 / 12) {
    const days = Math.round(years * 365);
    return `~${days} day${days !== 1 ? 's' : ''}`;
  }
  if (years < 1) {
    const months = Math.round(years * 12);
    return `~${months} month${months !== 1 ? 's' : ''}`;
  }
  if (years < 2) return '~1 year';
  return `~${Math.round(years)} years`;
}

/**
 * Format a confidence level as a human-readable label
 */
export function formatConfidence(level: 'high' | 'medium' | 'low'): string {
  return { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence / estimated' }[level];
}
