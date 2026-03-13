'use client';

import { ConflictScenario } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import { formatDuration } from '@/lib/utils/formatting';

interface ScenarioSelectorProps {
  value: ConflictScenario | null;
  onChange: (s: ConflictScenario) => void;
}

const SEVERITY: Record<string, { color: string; level: number }> = {
  precision_strike: { color: 'var(--accent-blue)',    level: 1 },
  skirmish:         { color: 'var(--accent-amber)',   level: 2 },
  conventional:     { color: '#f97316',               level: 3 },
  occupation:       { color: 'var(--accent-red)',     level: 4 },
};

function ThreatBars({ level, color, active }: { level: number; color: string; active: boolean }) {
  return (
    <div className="flex items-end gap-1" style={{ height: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: `${(i / 4) * 100}%`,
            background: i <= level ? color : 'var(--border)',
            opacity: active ? 1 : 0.4,
            transition: 'all 0.15s',
            borderRadius: 999,
          }}
        />
      ))}
    </div>
  );
}

const KEYS: Record<string, string> = {
  precision_strike: '1',
  skirmish:         '2',
  conventional:     '3',
  occupation:       '4',
};

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Object.values(SCENARIOS).map((s) => {
        const selected = value === s.id;
        const sev = SEVERITY[s.id];
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className="terminal-panel text-left transition-all focus:outline-none"
            style={{
              padding: '14px',
              borderColor: selected ? sev.color : 'var(--border)',
              background: selected ? 'linear-gradient(180deg, rgba(18, 33, 27, 0.95), rgba(14, 26, 21, 1))' : undefined,
              boxShadow: selected ? `0 0 0 1px ${sev.color}, 0 0 24px color-mix(in srgb, ${sev.color} 18%, transparent)` : undefined,
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = sev.color;
                e.currentTarget.style.background = 'rgba(84, 245, 214, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = '';
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: selected ? sev.color : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
              <div className="flex items-center gap-2">
                <ThreatBars level={sev.level} color={sev.color} active={selected} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  [{KEYS[s.id]}]
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-6" style={{ color: selected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
              {s.description}
            </p>
            <div className="mt-3">
              <span
                className="text-xs tabular-nums uppercase tracking-[0.16em]"
                style={{ color: selected ? 'var(--text-secondary)' : 'var(--text-muted)' }}
              >
                {formatDuration(s.durationYears.min)} – {formatDuration(s.durationYears.max)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
