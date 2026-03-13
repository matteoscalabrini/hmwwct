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
    <div className="flex items-end gap-0.5" style={{ height: 14 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: `${(i / 4) * 100}%`,
            background: i <= level ? color : 'var(--border-bright)',
            opacity: active ? 1 : 0.4,
            transition: 'all 0.15s',
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
    <div className="grid grid-cols-1 gap-1">
      {Object.values(SCENARIOS).map((s) => {
        const selected = value === s.id;
        const sev = SEVERITY[s.id];
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className="text-left px-3 py-2 transition-all focus:outline-none"
            style={{
              border: selected ? `1px solid ${sev.color}` : '1px solid var(--border)',
              borderLeft: selected ? `3px solid ${sev.color}` : '3px solid transparent',
              background: selected ? 'var(--surface-bright)' : 'var(--surface)',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: selected ? sev.color : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
              <div className="flex items-center gap-2">
                <ThreatBars level={sev.level} color={sev.color} active={selected} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  [{KEYS[s.id]}]
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {s.description}
            </p>
            <div className="mt-1">
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--text-muted)' }}
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
