import { describe, it, expect } from 'vitest';
import { nextFrame, prevFrame, buildCycleFrames } from '../cycleFrames';

const FRAMES = [
  { key: 'raw',    label: '$2.48T',  hint: 'TOTAL' },
  { key: 'pcap',   label: '$7,400',  hint: 'PER TAXPAYER' },
  { key: 'global', label: '$310',    hint: 'PER HUMAN' },
];

describe('nextFrame', () => {
  it('advances to the next frame', () => {
    expect(nextFrame(FRAMES, 'raw')).toBe('pcap');
    expect(nextFrame(FRAMES, 'pcap')).toBe('global');
  });
  it('wraps around', () => {
    expect(nextFrame(FRAMES, 'global')).toBe('raw');
  });
});

describe('prevFrame', () => {
  it('wraps backward', () => {
    expect(prevFrame(FRAMES, 'raw')).toBe('global');
  });
});

describe('buildCycleFrames', () => {
  it('builds frames for a total cost + scenario context', () => {
    const frames = buildCycleFrames({
      totalUsd: 2_480_000_000_000,
      aggressorPop: 335_000_000,
      worldPop: 8_100_000_000,
      usEducationAnnualUsd: 800_000_000_000,
      marshallPlanUsd: 130_000_000_000,
    });
    expect(frames.length).toBeGreaterThanOrEqual(4);
    expect(frames.some(f => f.key === 'raw')).toBe(true);
    expect(frames.some(f => f.key === 'pcap')).toBe(true);
  });
});
