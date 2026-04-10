export interface SelectOption {
  value: string;
  label: string;
}

export function filterMatches(options: SelectOption[], query: string, limit = 8): SelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  const results: SelectOption[] = [];
  for (const opt of options) {
    const haystack = `${opt.value} ${opt.label}`.toLowerCase();
    const words = haystack.split(/\s+/);
    if (words.some((w) => w.startsWith(q))) {
      results.push(opt);
      if (results.length >= limit) break;
    }
  }
  return results;
}
