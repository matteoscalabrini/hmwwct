'use client';

import { WarCostResult } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { useState } from 'react';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#06b6d4'];

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
    background: '#111111',
    border: '1px solid #2a2a2a',
    borderRadius: 2,
    fontSize: 12,
    color: '#e5e5e5',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Cost Distribution
        </p>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['bar', 'pie'] as ChartView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 text-xs font-medium capitalize transition-colors"
              style={{
                background: view === v ? 'var(--accent-blue)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-secondary)',
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
              tick={{ fontSize: 10, fill: '#999999' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#999999' }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Point est.']}
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#e5e5e5' }}
              labelStyle={{ color: '#999999' }}
              wrapperStyle={{ zIndex: 10000 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
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
                <span style={{ fontSize: 10, color: '#888888' }}>
                  {value}
                </span>
              )}
            />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Point est.']}
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#e5e5e5' }}
              labelStyle={{ color: '#999999' }}
              wrapperStyle={{ zIndex: 10000 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div className="space-y-1 text-center">
        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          Direct cost range: {formatCurrency(result.total.min)} — {formatCurrency(result.total.max)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Economic impact is charted above but excluded from the headline projected cost.
        </p>
      </div>
    </div>
  );
}
