'use client';

import { Panel } from '@/components/terminal/Panel';
import { TerminalSelect } from '@/components/terminal/TerminalSelect';
import { AsciiRule } from '@/components/terminal/AsciiRule';
import { SelectOption } from '@/lib/terminal/filterMatches';

const SCENARIOS = [
  { key: 'precision_strike', label: 'PRECISION' },
  { key: 'skirmish', label: 'SKIRMISH' },
  { key: 'conventional', label: 'CONVENTIONAL' },
  { key: 'occupation', label: 'OCCUPATION' },
] as const;

export interface ConflictParams {
  aggressor: string | null;
  target: string | null;
  scenario: string;
}

interface Props {
  countries: SelectOption[];
  value: ConflictParams;
  onChange: (params: ConflictParams) => void;
}

export function ConflictParametersPanel({ countries, value, onChange }: Props) {
  return (
    <Panel title="CONFLICT PARAMETERS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        <TerminalSelect
          label="AGGRESSOR"
          options={countries}
          value={value.aggressor ?? ''}
          onChange={(v) => onChange({ ...value, aggressor: v })}
        />
        <AsciiRule />
        <TerminalSelect
          label="TARGET"
          options={countries}
          value={value.target ?? ''}
          onChange={(v) => onChange({ ...value, target: v })}
        />
        <AsciiRule />
        <div>
          <div className="t-label fg-dim" style={{ marginBottom: 'var(--s-2)' }}>SCENARIO</div>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onChange({ ...value, scenario: s.key })}
                className="t-label"
                style={{
                  padding: 'var(--s-1) var(--s-2)',
                  border: '1px solid',
                  borderColor: value.scenario === s.key ? 'var(--phosphor)' : 'var(--fg-mute)',
                  background: value.scenario === s.key ? 'var(--phosphor)' : 'transparent',
                  color: value.scenario === s.key ? 'var(--bg)' : 'var(--fg-dim)',
                  cursor: 'pointer',
                  fontFamily: '"Ioskeley Mono", monospace',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
