'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BigBoard } from '@/components/terminal/BigBoard';
import { ConflictParametersPanel, ConflictParams } from '@/components/calculator/ConflictParametersPanel';
import { OperationsTheaterPanel } from '@/components/calculator/OperationsTheaterPanel';
import { CostAnalysisPanel } from '@/components/calculator/CostAnalysisPanel';
import { HumanTollPanel } from '@/components/calculator/HumanTollPanel';
import { useCalculate } from '@/lib/calculator/useCalculate';
import { PerPersonPanel } from '@/components/calculator/PerPersonPanel';
import { InsteadPanel } from '@/components/calculator/InsteadPanel';
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

  const { data: calcResult, isFetching: isCalculating } = useCalculate(params);

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
          onClickCountry={(iso) => {
            if (!params.aggressor || (params.aggressor && params.target)) {
              setParams({ ...params, aggressor: iso, target: null });
            } else if (iso !== params.aggressor) {
              setParams({ ...params, target: iso });
            }
          }}
        />
      }
      cost={
        <CostAnalysisPanel
          result={calcResult ?? null}
          isLoading={isCalculating && !calcResult}
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
          killed={calcResult?.humanToll?.killedPoint ?? null}
          displaced={calcResult?.humanToll?.displacedPersonsPoint ?? null}
          targetPopulation={targetPop ?? null}
        />
      }
      perPerson={
        <>
          <PerPersonPanel
            totalCost={calcResult?.total?.point ?? null}
            aggressorPop={aggressorPop}
            aggressorName={aggressorName}
          />
          <InsteadPanel totalCost={calcResult?.total?.point ?? null} />
        </>
      }
    />
  );
}
