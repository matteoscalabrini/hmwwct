'use client';

import { Panel } from '@/components/terminal/Panel';
import { DataTable } from '@/components/terminal/DataTable';
import { CharBar } from '@/components/terminal/CharBar';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';
import { AsciiRule } from '@/components/terminal/AsciiRule';
import { formatCompactUsd } from '@/lib/terminal/formatters';
import { WarClock } from './WarClock';
import { InHumanTerms } from './InHumanTerms';
import { buildObituary } from '@/lib/calculator/obituaries';
import { NetPositionLine } from './NetPositionLine';

interface RangeValue {
  min: number;
  max: number;
  point: number;
}

interface RevenueResult {
  totalUsd: number;
  netPositionUsd: number;
  breakEvenYears: number | null;
  items: { label: string }[];
}

interface CalculationResult {
  total: RangeValue;
  breakdown: {
    military: RangeValue;
    economic: RangeValue;
    humanitarian: RangeValue;
    reconstruction: RangeValue;
  };
  duration: RangeValue & { unit: string };
  revenue?: RevenueResult;
}

interface Props {
  result: CalculationResult | null;
  isLoading?: boolean;
  durationYears?: number;
  aggressorPop?: number;
  aggressorName?: string;
  aggressorGdp?: number;
  targetName?: string;
  targetGdp?: number;
}

const CALC_STEPS = [
  'FETCHING WORLD BANK INDICATORS',
  'RESOLVING MILITARY BUDGETS',
  'COMPUTING TRADE DISRUPTION',
  'MODELING HUMANITARIAN IMPACT',
  'ESTIMATING RECONSTRUCTION',
  'AGGREGATING COST RANGES',
];

function CalculatingOverlay() {
  return (
    <Panel title="COST ANALYSIS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <p className="t-data fg-phos">&gt; CALCULATING <BlinkCursor /></p>
        <div style={{ marginTop: 'var(--s-2)' }}>
          {CALC_STEPS.map((step, i) => (
            <p key={step} className="t-label fg-dim" style={{
              animationName: 'blink',
              animationDuration: '1s',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.3}s`,
            }}>
              [{i < CALC_STEPS.length - 1 ? 'OK' : '..'}] {step}
            </p>
          ))}
        </div>
        <div style={{ marginTop: 'var(--s-3)', height: 6, background: 'var(--fg-mute)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--phosphor)',
            width: '60%',
            animation: 'progress-bar 2s ease-in-out infinite',
          }} />
        </div>
      </div>
    </Panel>
  );
}

export function CostAnalysisPanel({ result, isLoading, durationYears, aggressorPop, aggressorName, aggressorGdp, targetName, targetGdp }: Props) {
  if (isLoading) {
    return <CalculatingOverlay />;
  }

  if (!result) {
    return (
      <Panel title="COST ANALYSIS">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const { total, breakdown, revenue } = result;
  const maxVal = total.max || 1;

  const obituaryCtx = {
    aggressorName: aggressorName ?? 'Aggressor',
    aggressorGdp: aggressorGdp ?? 1,
    targetName: targetName ?? 'Target',
    targetGdp: targetGdp ?? 1,
  };

  return (
    <Panel title="COST ANALYSIS" tone="phosphor">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        {durationYears && <WarClock totalPoint={total.point} durationYears={durationYears} />}

        <div className="t-hero fg-phos">
          {formatCompactUsd(total.point)}
        </div>

        <CharBar
          label="RANGE"
          value={total.point / maxVal}
          displayValue={`${formatCompactUsd(total.min)} – ${formatCompactUsd(total.max)}`}
        />

        <AsciiRule />

        <DataTable>
          <DataTable.Row
            label="MILITARY"
            value={formatCompactUsd(breakdown.military.point)}
            footnote={buildObituary('military', breakdown.military.point, obituaryCtx)}
          />
          <DataTable.Row
            label="ECONOMIC"
            value={formatCompactUsd(breakdown.economic.point)}
            footnote={buildObituary('economic', breakdown.economic.point, obituaryCtx)}
          />
          <DataTable.Row
            label="HUMANITARIAN"
            value={formatCompactUsd(breakdown.humanitarian.point)}
            tone="alert"
            footnote={buildObituary('humanitarian', breakdown.humanitarian.point, obituaryCtx)}
          />
          <DataTable.Row
            label="RECONSTRUCTION"
            value={formatCompactUsd(breakdown.reconstruction.point)}
            footnote={buildObituary('reconstruction', breakdown.reconstruction.point, obituaryCtx)}
          />
        </DataTable>

        {aggressorPop && <InHumanTerms totalUsd={total.point} aggressorPop={aggressorPop} />}

        <NetPositionLine
          netPositionUsd={revenue?.netPositionUsd ?? 0}
          breakEvenYears={revenue?.breakEvenYears ?? null}
          totalRevenueUsd={revenue?.totalUsd ?? 0}
          hasItems={revenue ? revenue.items.length > 0 : false}
        />
      </div>
    </Panel>
  );
}
