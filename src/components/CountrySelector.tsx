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
    <div className="flex items-center gap-2 py-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.data.flag} alt="" className="h-3.5 w-5 object-cover shrink-0" loading="lazy" />
      <span className="text-xs tracking-wider">{props.data.label}</span>
      <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>{props.data.region}</span>
    </div>
  </components.Option>
);

const FlagSingleValue = (props: SingleValueProps<CountryOption>) => (
  <components.SingleValue {...props}>
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.data.flag} alt="" className="h-3.5 w-5 object-cover shrink-0" />
      <span className="text-xs tracking-wider">{props.data.label}</span>
    </div>
  </components.SingleValue>
);

const terminalStyles: StylesConfig<CountryOption> = {
  control: (base, state) => ({
    ...base,
    background: 'var(--panel)',
    border: `1px solid ${state.isFocused ? 'var(--green-dim)' : 'var(--border)'}`,
    borderRadius: 0,
    boxShadow: state.isFocused ? '0 0 0 1px var(--green-dark)' : 'none',
    color: 'var(--green)',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    padding: '2px 4px',
    '&:hover': { borderColor: 'var(--green-dark)' },
  }),
  menu: (base) => ({
    ...base,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 0,
    zIndex: 100,
  }),
  menuList: (base) => ({ ...base, padding: 0 }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--green-faint)' : 'var(--panel)',
    color: state.isFocused ? 'var(--green)' : 'var(--green-dim)',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({ ...base, color: 'var(--green)' }),
  placeholder: (base) => ({ ...base, color: 'var(--text-dim)', fontSize: '12px' }),
  input: (base) => ({ ...base, color: 'var(--green)', fontFamily: "'Courier New', Courier, monospace" }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: 'var(--text-dim)', padding: '4px' }),
  loadingIndicator: (base) => ({ ...base, color: 'var(--green-dim)' }),
  noOptionsMessage: (base) => ({ ...base, color: 'var(--text-dim)', fontSize: '12px' }),
};

interface CountrySelectorProps {
  aggressorCode: string | null;
  targetCode: string | null;
  onAggressorChange: (code: string) => void;
  onTargetChange: (code: string) => void;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--green-dim)' }}>
          AGGRESSOR NATION
        </label>
        <Select
          instanceId="aggressor"
          options={aggressorOptions}
          value={aggressorOptions.find((c) => c.value === aggressorCode) ?? null}
          onChange={(opt) => { if (opt && !Array.isArray(opt)) onAggressorChange((opt as CountryOption).value); }}
          components={{ Option: FlagOption, SingleValue: FlagSingleValue }}
          isLoading={loading}
          placeholder="TYPE TO SEARCH..."
          isSearchable
          styles={terminalStyles}
          aria-label="Select aggressor country"
          noOptionsMessage={() => 'NO MATCH FOUND'}
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--green-dim)' }}>
          TARGET NATION
        </label>
        <Select
          instanceId="target"
          options={targetOptions}
          value={targetOptions.find((c) => c.value === targetCode) ?? null}
          onChange={(opt) => { if (opt && !Array.isArray(opt)) onTargetChange((opt as CountryOption).value); }}
          components={{ Option: FlagOption, SingleValue: FlagSingleValue }}
          isLoading={loading}
          placeholder="TYPE TO SEARCH..."
          isSearchable
          styles={terminalStyles}
          aria-label="Select target country"
          noOptionsMessage={() => 'NO MATCH FOUND'}
        />
      </div>
    </div>
  );
}
