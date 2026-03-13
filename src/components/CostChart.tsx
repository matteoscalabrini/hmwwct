'use client';

import { WarCostResult } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { useState } from 'react';

const CHART_COLORS = ['#54f5d6', '#d6ff6b', '#ff765b', '#f7bf63'];

interface CostChartProps { result: WarCostResult; }
type ChartView = 'bar' | 'pie';

export function CostChart({ result }: CostChartProps) {
  const [view, setView] = useState<ChartView>('bar');

  const data = Object.entries(result.breakdown).map(([, cat], i) => ({
    name: cat.label,
    value: cat.amount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const tooltipStyle = {
    background: '#0c1512',
    border: '1px solid #2d5d49',
    borderRadius: 6,
    fontSize: 12,
    color: '#effaf4',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div className="terminal-panel space-y-4 px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
          Cost Distribution
        </p>
        <div className="flex overflow-hidden rounded-full border" style={{ borderColor: 'var(--border)' }}>
          {(['bar', 'pie'] as ChartView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors"
              style={{
                background: view === v ? 'rgba(84, 245, 214, 0.12)' : 'transparent',
                color: view === v ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'bar' && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10, fill: '#73917f', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#b4d6c4', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Point est.']}
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#effaf4' }}
              labelStyle={{ color: '#73917f' }}
              wrapperStyle={{ zIndex: 10000 }}
              cursor={{ fill: 'rgba(84, 245, 214, 0.05)' }}
            />
            <Bar dataKey="value" isAnimationActive radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {view === 'pie' && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={75}
              isAnimationActive
              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 10, color: '#73917f' }}>
                  {value}
                </span>
              )}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Point est.']}
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#effaf4' }}
              labelStyle={{ color: '#73917f' }}
              wrapperStyle={{ zIndex: 10000 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div className="space-y-1 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--text-secondary)' }}>
          Direct cost range: {formatCurrency(result.total.min)} — {formatCurrency(result.total.max)}
        </p>
        <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
          Economic impact is charted above but excluded from the headline projected cost.
        </p>
      </div>
    </div>
  );
}
