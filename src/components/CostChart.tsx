'use client';

import { WarCostResult } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { useState } from 'react';

// Terminal blue palette for chart segments
const CHART_COLORS = ['#a8daff', '#5bb8e8', '#ffb000', '#3a7a99'];

interface CostChartProps { result: WarCostResult; }
type ChartView = 'bar' | 'pie';

export function CostChart({ result }: CostChartProps) {
  const [view, setView] = useState<ChartView>('bar');

  const data = Object.entries(result.breakdown).map(([, cat], i) => ({
    name: cat.label.toUpperCase(),
    value: cat.amount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const tooltipStyle = {
    background: 'var(--panel)',
    border: '1px solid var(--green-dim)',
    borderRadius: 0,
    fontSize: 11,
    fontFamily: "'Courier New', Courier, monospace",
    color: 'var(--green)',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
          COST CHART
        </p>
        <div className="flex text-xs" style={{ border: '1px solid var(--border)' }}>
          {(['bar', 'pie'] as ChartView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 tracking-widest uppercase transition-colors"
              style={{
                background: view === v ? 'var(--green)' : 'transparent',
                color: view === v ? 'var(--bg)' : 'var(--text-dim)',
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
              tick={{ fontSize: 9, fill: '#3a7a99', fontFamily: "'Courier New', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 9, fill: '#3a7a99', fontFamily: "'Courier New', monospace" }}
              axisLine={false}
              tickLine={false}
              width={85}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'POINT EST.']}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(168,218,255,0.05)' }}
            />
            <Bar dataKey="value" isAnimationActive radius={0}>
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
                <span style={{ fontSize: 9, fontFamily: "'Courier New', monospace", color: '#3a7a99' }}>
                  {value}
                </span>
              )}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'POINT EST.']}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      <p className="text-xs text-center tracking-wider" style={{ color: 'var(--text-dim)' }}>
        RANGE: {formatCurrency(result.total.min)} — {formatCurrency(result.total.max)}
      </p>
    </div>
  );
}
