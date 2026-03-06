'use client';

import { ConflictScenario } from '@/types';
import { SCENARIOS } from '@/constants/conflict-scenarios';
import { formatDuration } from '@/lib/utils/formatting';

interface ScenarioSelectorProps {
  value: ConflictScenario | null;
  onChange: (s: ConflictScenario) => void;
}

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Object.values(SCENARIOS).map((s) => {
        const selected = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className="text-left p-5 transition-all focus:outline-none"
            style={{
              border: selected ? '1px solid var(--green)' : '1px solid var(--border)',
              background: selected ? 'rgba(0,255,65,0.05)' : 'var(--panel)',
              boxShadow: selected ? '0 0 12px rgba(0,255,65,0.15)' : 'none',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: selected ? 'var(--green)' : 'var(--green-dim)' }}
              >
                {selected ? '▶ ' : '  '}{s.label}
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-dim)' }}>
              {s.description}
            </p>
            <p className="text-xs italic mb-3" style={{ color: 'var(--text-muted)' }}>
              {s.examples}
            </p>
            <span
              className="text-xs px-2 py-0.5 tracking-wider"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              {formatDuration(s.durationYears.min)} – {formatDuration(s.durationYears.max)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
