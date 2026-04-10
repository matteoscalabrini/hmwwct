export interface BarSplit {
  filled: number;
  empty: number;
}

export function splitBar(value: number, width: number): BarSplit {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * width);
  return { filled, empty: width - filled };
}
