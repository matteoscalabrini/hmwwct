export interface SelectOption {
  value: string;
  label: string;
  /** Tiny flag icon URL (flagcdn SVG) — optional. */
  flag?: string;
}

/** Returns every matching option — the dropdown list scrolls, no truncation. */
export function filterMatches(options: SelectOption[], query: string): SelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const results: SelectOption[] = [];
  for (const opt of options) {
    const haystack = `${opt.value} ${opt.label}`.toLowerCase();
    const words = haystack.split(/\s+/);
    if (words.some((w) => w.startsWith(q))) {
      results.push(opt);
    }
  }
  return results;
}
