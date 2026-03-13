'use client';

import { ConflictScenario } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import { formatDuration } from '@/lib/utils/formatting';

interface ScenarioSelectorProps {
  value: ConflictScenario | null;
  onChange: (s: ConflictScenario) => void;
}

const DEFCON: Record<string, { level: number; color: string; bars: number }> = {
  skirmish:     { level: 4, color: 'var(--amber)', bars: 2 },
  conventional: { level: 3, color: '#ff8800',      bars: 3 },
  occupation:   { level: 2, color: 'var(--red)',   bars: 4 },
};

function DefconBars({ bars, color, selected }: { bars: number; color: string; selected: boolean }) {
  return (
    <div className="flex items-end gap-0.5" style={{ height: 14 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 3 + i * 2.5,
            background: i <= bars ? color : 'var(--border)',
            opacity: selected ? 1 : 0.55,
            transition: 'background 0.2s, opacity 0.2s',
          }}
        />
      ))}
    </div>
  );
}

const KEYS: Record<string, string> = { skirmish: '1', conventional: '2', occupation: '3' };

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Object.values(SCENARIOS).map((s) => {
        const selected = value === s.id;
        const defcon = DEFCON[s.id];
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className="text-left p-5 transition-all focus:outline-none flex flex-col justify-start"
            style={{
              border: selected ? `1px solid ${defcon.color}` : '1px solid var(--border)',
              background: 'var(--panel)',
              boxShadow: selected ? `0 0 14px color-mix(in srgb, ${defcon.color} 18%, transparent)` : 'none',
            }}
          >
            {/* Header: label + DEFCON indicator */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: selected ? defcon.color : 'var(--green-dim)' }}
              >
                {selected ? '▶ ' : '  '}{s.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <DefconBars bars={defcon.bars} color={defcon.color} selected={selected} />
                <span
                  className="text-xs font-bold tracking-widest"
                  style={{ color: selected ? defcon.color : 'var(--text-muted)' }}
                >
                  {defcon.level}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-dim)' }}>
              {s.description}
            </p>
            <p className="text-xs italic mb-3" style={{ color: 'var(--text-muted)' }}>
              {s.examples}
            </p>

            <div className="flex items-center justify-between">
              <span
                className="text-xs px-2 py-0.5 tracking-wider"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                {formatDuration(s.durationYears.min)} – {formatDuration(s.durationYears.max)}
              </span>
              <span className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
                [{KEYS[s.id]}]
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
