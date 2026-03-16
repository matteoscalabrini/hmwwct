'use client';

import { useEffect, useState } from 'react';
import Select, { components, OptionProps, SingleValueProps, StylesConfig } from 'react-select';
import { RestCountryRaw } from '@/lib/api/restcountries';

interface CountryOption {
  value: string;
  label: string;
  flag: string;
  region: string;
}

function toOption(c: RestCountryRaw): CountryOption {
  return { value: c.cca3, label: c.name.common, flag: c.flags.png, region: c.region };
}

const FlagOption = (props: OptionProps<CountryOption>) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2.5 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.data.flag} alt="" className="h-3 w-[18px] object-cover shrink-0" loading="lazy" />
      <span className="text-xs uppercase tracking-[0.16em]">{props.data.label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {props.data.value}
      </span>
    </div>
  </components.Option>
);

const FlagSingleValue = (props: SingleValueProps<CountryOption>) => (
  <components.SingleValue {...props}>
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.data.flag} alt="" className="h-3 w-[18px] object-cover shrink-0" />
      <span className="text-xs uppercase tracking-[0.1em]">{props.data.label}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>[{props.data.value}]</span>
    </div>
  </components.SingleValue>
);

const selectStyles: StylesConfig<CountryOption> = {
  control: (base, state) => ({
    ...base,
    background: '#0a0a0a',
    border: `1px solid ${state.isFocused ? '#ffffff' : '#ffffff'}`,
    borderRadius: 0,
    boxShadow: 'none',
    color: 'var(--text)',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.05em',
    padding: '4px 6px',
    minHeight: '46px',
    '&:hover': { borderColor: '#ffffff' },
  }),
  menu: (base) => ({
    ...base,
    background: '#0a0a0a',
    border: '1px solid #ffffff',
    borderRadius: 0,
    zIndex: 100,
    overflow: 'hidden',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
  }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? '#ffffff' : 'transparent',
    color: state.isFocused ? '#000000' : '#ffffff',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
    cursor: 'pointer',
    borderRadius: 0,
    margin: '0',
  }),
  singleValue: (base) => ({ ...base, color: 'var(--text)' }),
  placeholder: (base) => ({ ...base, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }),
  input: (base) => ({ ...base, color: 'var(--text)', fontSize: '12px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: 'var(--text-muted)', padding: '4px 8px' }),
  loadingIndicator: (base) => ({ ...base, color: '#ffffff' }),
  noOptionsMessage: (base) => ({ ...base, color: 'var(--text-muted)', fontSize: '12px' }),
};

interface CountrySelectorProps {
  aggressorCode: string | null;
  targetCode: string | null;
  onAggressorChange: (code: string | null) => void;
  onTargetChange: (code: string | null) => void;
}

export function CountrySelector({ aggressorCode, targetCode, onAggressorChange, onTargetChange }: CountrySelectorProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data: RestCountryRaw[]) => { setCountries(data.map(toOption)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const aggressorOptions = countries.filter((c) => c.value !== targetCode);
  const targetOptions = countries.filter((c) => c.value !== aggressorCode);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--aggressor)' }}>
          AGGRESSOR
        </label>
        <Select
          instanceId="aggressor"
          options={aggressorOptions}
          value={aggressorOptions.find((c) => c.value === aggressorCode) ?? null}
          onChange={(opt) => { if (opt && !Array.isArray(opt)) onAggressorChange((opt as CountryOption).value); }}
          components={{ Option: FlagOption, SingleValue: FlagSingleValue }}
          isLoading={loading}
          placeholder="Search country..."
          isSearchable
          styles={selectStyles}
          aria-label="Select aggressor country"
          noOptionsMessage={() => 'NO MATCH'}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--target)' }}>
          TARGET
        </label>
        <Select
          instanceId="target"
          options={targetOptions}
          value={targetOptions.find((c) => c.value === targetCode) ?? null}
          onChange={(opt) => { if (opt && !Array.isArray(opt)) onTargetChange((opt as CountryOption).value); }}
          components={{ Option: FlagOption, SingleValue: FlagSingleValue }}
          isLoading={loading}
          placeholder="Search country..."
          isSearchable
          styles={selectStyles}
          aria-label="Select target country"
          noOptionsMessage={() => 'NO MATCH'}
        />
      </div>
    </div>
  );
}
