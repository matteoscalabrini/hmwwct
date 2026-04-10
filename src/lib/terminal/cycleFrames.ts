import { formatCompactUsd, formatFullUsd, perCapita } from './formatters';

export interface CycleFrame {
  key: string;
  label: string;
  hint: string;
}

export function nextFrame(frames: CycleFrame[], current: string): string {
  const i = frames.findIndex((f) => f.key === current);
  if (i < 0) return frames[0].key;
  return frames[(i + 1) % frames.length].key;
}

export function prevFrame(frames: CycleFrame[], current: string): string {
  const i = frames.findIndex((f) => f.key === current);
  if (i < 0) return frames[frames.length - 1].key;
  return frames[(i - 1 + frames.length) % frames.length].key;
}

interface BuildInput {
  totalUsd: number;
  aggressorPop: number;
  worldPop: number;
  usEducationAnnualUsd: number;
  marshallPlanUsd: number;
}

export function buildCycleFrames(input: BuildInput): CycleFrame[] {
  const { totalUsd, aggressorPop, worldPop, usEducationAnnualUsd, marshallPlanUsd } = input;
  return [
    { key: 'raw',        label: formatCompactUsd(totalUsd),                           hint: 'TOTAL COST' },
    { key: 'full',       label: formatFullUsd(totalUsd),                              hint: 'EVERY DOLLAR' },
    { key: 'pcap',       label: formatFullUsd(perCapita(totalUsd, aggressorPop)),     hint: 'PER TAXPAYER' },
    { key: 'global',     label: formatFullUsd(perCapita(totalUsd, worldPop)),         hint: 'PER HUMAN ON EARTH' },
    { key: 'edu-years',  label: `${(totalUsd / usEducationAnnualUsd).toFixed(1)}`,    hint: 'YEARS OF US EDUCATION BUDGET' },
    { key: 'marshall',   label: `${(totalUsd / marshallPlanUsd).toFixed(0)}×`,        hint: 'THE MARSHALL PLAN' },
  ];
}
