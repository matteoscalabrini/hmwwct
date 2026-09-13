import { palette } from './palette';

export type CellTone = 'ocean' | 'neutral' | 'glow' | 'aggressor' | 'target' | 'glow-high' | 'glow-med' | 'glow-low';

export interface ResolveContext {
  aggressor: string;
  target: string;
  glowSet: Set<string>;
  overlay?: Map<string, string>;
}

export function resolveCellTone(iso: string | null, ctx: ResolveContext): CellTone {
  if (iso === null) return 'ocean';
  if (iso === ctx.target) return 'target';
  if (iso === ctx.aggressor) return 'aggressor';
  if (ctx.overlay?.has(iso)) return ctx.overlay.get(iso) as CellTone;
  if (ctx.glowSet.has(iso)) return 'glow';
  return 'neutral';
}

export function toneColor(tone: CellTone): string {
  switch (tone) {
    case 'ocean':     return palette.bg;
    case 'neutral':   return palette.fgMute;
    case 'glow':      return palette.accent;
    case 'aggressor': return palette.accent;
    case 'target':    return palette.alert;
    case 'glow-high': return '#ffffff';
    case 'glow-med':  return '#b3b3b3';
    case 'glow-low':  return '#6a6a6a';
  }
}
