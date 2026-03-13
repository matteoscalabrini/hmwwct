'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
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
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
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
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: '12px',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({ ...base, color: 'var(--green)' }),
  placeholder: (base) => ({ ...base, color: 'var(--text-dim)', fontSize: '12px' }),
  input: (base) => ({ ...base, color: 'var(--green)', fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: 'var(--text-dim)', padding: '4px' }),
  loadingIndicator: (base) => ({ ...base, color: 'var(--green-dim)' }),
  noOptionsMessage: (base) => ({ ...base, color: 'var(--text-dim)', fontSize: '12px' }),
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
  const [isSwapHovered, setIsSwapHovered] = useState(false);

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data: RestCountryRaw[]) => { setCountries(data.map(toOption)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const aggressorOptions = countries.filter((c) => c.value !== targetCode);
  const targetOptions = countries.filter((c) => c.value !== aggressorCode);
  const canSwap = aggressorCode !== null || targetCode !== null;

  function handleSwap() {
    if (!canSwap) return;
    onAggressorChange(targetCode);
    onTargetChange(aggressorCode);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-rows-[auto_1fr] gap-4 md:gap-x-6 md:gap-y-2 items-center">
      <label
        className="hidden md:block md:col-start-1 md:row-start-1 text-xs tracking-widest uppercase"
        style={{ color: 'var(--green-dim)' }}
      >
        AGGRESSOR NATION
      </label>
      <label
        className="hidden md:block md:col-start-3 md:row-start-1 text-xs tracking-widest uppercase"
        style={{ color: 'var(--green-dim)' }}
      >
        TARGET NATION
      </label>

      <div className="md:col-start-1 md:row-start-2">
          <label className="block text-xs tracking-widest uppercase mb-2 md:hidden" style={{ color: 'var(--green-dim)' }}>
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
      <div className="flex justify-center self-center md:col-start-2 md:row-start-2">
          <button
            type="button"
            onClick={handleSwap}
            onMouseEnter={() => setIsSwapHovered(true)}
            onMouseLeave={() => setIsSwapHovered(false)}
            disabled={!canSwap}
            aria-label="Swap aggressor and target nations"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${canSwap && isSwapHovered ? 'var(--green-dim)' : 'var(--border)'}`,
              background: canSwap && isSwapHovered ? 'var(--green-faint)' : 'var(--panel)',
              color: canSwap ? (isSwapHovered ? 'var(--green)' : 'var(--green-dim)') : 'var(--text-dim)',
            }}
          >
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            <span>Swap</span>
          </button>
      </div>
      <div className="md:col-start-3 md:row-start-2">
          <label className="block text-xs tracking-widest uppercase mb-2 md:hidden" style={{ color: 'var(--green-dim)' }}>
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
