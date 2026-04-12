'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BigBoard } from '@/components/terminal/BigBoard';
import { Panel } from '@/components/terminal/Panel';
import { ConflictParametersPanel, ConflictParams } from '@/components/calculator/ConflictParametersPanel';
import { OperationsTheaterPanel } from '@/components/calculator/OperationsTheaterPanel';
import type { RestCountryRaw } from '@/lib/api/restcountries';

export default function CalculatorPage() {
  const [params, setParams] = useState<ConflictParams>({
    aggressor: null,
    target: null,
    scenario: 'conventional',
  });

  const { data: countries = [] } = useQuery<RestCountryRaw[]>({
    queryKey: ['countries'],
    queryFn: () => fetch('/api/countries').then((r) => r.json()),
  });

  const countryOptions = countries.map((c) => ({
    value: c.cca3,
    label: c.name.common,
  }));

  const countriesByIso = Object.fromEntries(
    countries.map((c) => [
      c.cca3,
      { name: c.name.common, population: c.population },
    ])
  );

  return (
    <BigBoard
      parameters={
        <ConflictParametersPanel
          countries={countryOptions}
          value={params}
          onChange={setParams}
        />
      }
      theater={
        <OperationsTheaterPanel
          aggressor={params.aggressor}
          target={params.target}
          countriesByIso={countriesByIso}
        />
      }
      cost={<Panel title="COST ANALYSIS">placeholder</Panel>}
      humanToll={<Panel title="HUMAN TOLL">placeholder</Panel>}
      perPerson={<Panel title="PER PERSON">placeholder</Panel>}
      history={<Panel title="HISTORY">placeholder</Panel>}
    />
  );
}
