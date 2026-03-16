'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';

interface BudgetReallocationProps {
  totalCost: number;
  durationYears: number;
  aggressorGdp: number;
  aggressorName: string;
}

interface SectorData {
  name: string;
  pctOfGdp: number;
  sectorBudget: number;
  warConsumption: number;
  remaining: number;
  consumedPct: number;
}

const SECTORS = [
  { name: 'Social Protection', pctOfGdp: 0.12 },
  { name: 'Healthcare', pctOfGdp: 0.07 },
  { name: 'Education', pctOfGdp: 0.05 },
  { name: 'Infrastructure', pctOfGdp: 0.035 },
  { name: 'Defense (existing)', pctOfGdp: 0.02 },
] as const;

export function BudgetReallocation({
  totalCost,
  durationYears,
  aggressorGdp,
  aggressorName,
}: BudgetReallocationProps) {
  const annualWarCost = totalCost / Math.max(durationYears, 0.1);

  const sectors: SectorData[] = useMemo(() => {
    return SECTORS.map((s) => {
      const sectorBudget = aggressorGdp * s.pctOfGdp;
      const warConsumption = Math.min(annualWarCost, sectorBudget);
      const remaining = Math.max(sectorBudget - annualWarCost, 0);
      const consumedPct = (annualWarCost / sectorBudget) * 100;
      return {
        name: s.name,
        pctOfGdp: s.pctOfGdp,
        sectorBudget,
        warConsumption,
        remaining,
        consumedPct,
      };
    });
  }, [aggressorGdp, annualWarCost]);

  const fullyConsumedSectors = sectors.filter((s) => s.consumedPct >= 100);
  const totalConsumedBudgets = fullyConsumedSectors.reduce(
    (sum, s) => sum + s.sectorBudget,
    0,
  );

  // Chart data: show remaining budget + war portion as stacked
  const chartData = sectors.map((s) => ({
    name: s.name,
    Remaining: s.remaining,
    'War Cost': s.warConsumption,
  }));

  const warCostPctOfGdp = (annualWarCost / aggressorGdp) * 100;

  return (
    <div className="terminal-panel space-y-5 px-5 py-5">
      <div className="space-y-1">
        <h3 className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
          To fund this conflict, {aggressorName} would need to redirect:
        </h3>
        <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
          Annual war cost:{' '}
          <span className="font-mono font-semibold" style={{ color: 'var(--accent-red)' }}>
            {formatCurrency(annualWarCost)}/year
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            ({formatPercent(warCostPctOfGdp)} of GDP)
          </span>
        </p>
      </div>

      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            barSize={22}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fill: '#ffffff', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: '#ffffff' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: '#ffffff', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#000',
                border: '1px solid #ffffff',
                borderRadius: 0,
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              labelStyle={{ color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}
              itemStyle={{ color: '#ffffff' }}
              formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
            />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 11, color: '#ffffff', paddingTop: 8 }}
            />
            <Bar dataKey="Remaining" stackId="a" radius={[0, 0, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#1a1a1a" />
              ))}
            </Bar>
            <Bar dataKey="War Cost" stackId="a" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#ff765b" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {sectors.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs gap-4">
            <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            <span
              className="font-mono font-semibold"
              style={{
                color: s.consumedPct >= 100 ? 'var(--accent-red)' : 'var(--accent-amber)',
              }}
            >
              {s.consumedPct >= 100
                ? 'FULLY CONSUMED'
                : `${formatPercent(Math.min(s.consumedPct, 999.9))} consumed`}
            </span>
          </div>
        ))}
      </div>

      {fullyConsumedSectors.length > 0 && (
        <div
          className="terminal-callout is-danger px-4 py-3 text-xs leading-6"
          style={{
            color: 'var(--accent-red)',
          }}
        >
          This war costs more than the entire{' '}
          {fullyConsumedSectors.map((s) => s.name.toLowerCase()).join(' + ')}{' '}
          budget{fullyConsumedSectors.length > 1 ? 's' : ''} combined
          {totalConsumedBudgets > 0 && (
            <span className="font-mono"> ({formatCurrency(totalConsumedBudgets)})</span>
          )}
          .
        </div>
      )}

      <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
        Budget shares based on OECD averages. Actual allocation varies by country.
      </p>
    </div>
  );
}
