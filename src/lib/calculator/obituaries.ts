export type ObituaryCategory = 'military' | 'economic' | 'humanitarian' | 'reconstruction';

interface Ctx {
  aggressorName: string;
  aggressorGdp: number;
  targetName: string;
  targetGdp: number;
}

function pct(v: number, base: number): string {
  return ((v / Math.max(1, base)) * 100).toFixed(1);
}

function round(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString('en-US');
  if (n >= 10) return Math.round(n).toString();
  return n.toFixed(1);
}

const TEMPLATES: Record<ObituaryCategory, ((v: number, c: Ctx) => string)[]> = {
  military: [
    (v, c) => `${pct(v, c.aggressorGdp)}% of ${c.aggressorName}'s annual GDP, burned.`,
    (v) => `Enough to fund the entire NASA budget for ${round(v / 25e9)} years.`,
    (v) => `${round(v / 500e6)} hospitals that will never be built.`,
  ],
  economic: [
    (v, c) => `${pct(v, c.targetGdp)}% of ${c.targetName}'s economy, erased.`,
    (v) => `${round(v / 1e9)} billion dollars of trade, vanished from the ledger.`,
    () => `Equal to the entire GDP of a mid-sized country, wiped out.`,
  ],
  humanitarian: [
    (v) => `Refugee support for ${round(v / 15000)} people for a full year.`,
    (v) => `UNHCR's annual global budget, ${round(v / 10e9)} times over.`,
    (v) => `${round(v / 1000)} families displaced, clothed, and fed for twelve months.`,
  ],
  reconstruction: [
    () => `A decade of domestic infrastructure spending, in rubble and then replaced.`,
    (v, c) => `${pct(v, c.targetGdp)}% of ${c.targetName}'s GDP, spent twice — once destroying, once rebuilding.`,
    (v) => `Rebuilding ${round(v / 200e9)} countries' worth of bridges, roads, and power grids.`,
  ],
};

export function buildObituary(cat: ObituaryCategory, value: number, ctx: Ctx): string {
  const templates = TEMPLATES[cat];
  const safe = Number.isFinite(value) && value > 0 ? value : 1;
  const idx = Math.floor(safe / 1e9) % templates.length;
  return templates[idx](safe, ctx);
}
