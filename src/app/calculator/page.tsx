'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BigBoard } from '@/components/terminal/BigBoard';
import { Panel } from '@/components/terminal/Panel';
import { ConflictParametersPanel, ConflictParams } from '@/components/calculator/ConflictParametersPanel';
import { OperationsTheaterPanel } from '@/components/calculator/OperationsTheaterPanel';
import { CostAnalysisPanel } from '@/components/calculator/CostAnalysisPanel';
import { HumanTollPanel } from '@/components/calculator/HumanTollPanel';
import { useCalculate } from '@/lib/calculator/useCalculate';
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

  const { data: calcResult } = useCalculate(params);

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

  const aggressorPop = params.aggressor ? countriesByIso[params.aggressor]?.population : undefined;
  const aggressorName = params.aggressor ? countriesByIso[params.aggressor]?.name : undefined;
  const targetName = params.target ? countriesByIso[params.target]?.name : undefined;
  const aggressorGdp = calcResult?.inputs?.aggressorGdp ?? undefined;
  const targetGdp = calcResult?.inputs?.targetGdp ?? undefined;
  const targetPop = params.target ? countriesByIso[params.target]?.population : undefined;

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
      cost={
        <CostAnalysisPanel
          result={calcResult ?? null}
          durationYears={calcResult?.duration?.point}
          aggressorPop={aggressorPop}
          aggressorName={aggressorName}
          aggressorGdp={aggressorGdp}
          targetName={targetName}
          targetGdp={targetGdp}
        />
      }
      humanToll={
        <HumanTollPanel
          displaced={calcResult?.humanToll?.displacedPersonsPoint ?? null}
          targetPopulation={targetPop ?? null}
        />
      }
      perPerson={<Panel title="PER PERSON">placeholder</Panel>}
      history={<Panel title="HISTORY">placeholder</Panel>}
    />
  );
}
