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

interface RangeValue {
  min: number;
  max: number;
  point: number;
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
}

interface Props {
  result: CalculationResult | null;
  durationYears?: number;
  aggressorPop?: number;
  aggressorName?: string;
  aggressorGdp?: number;
  targetName?: string;
  targetGdp?: number;
}

export function CostAnalysisPanel({ result, durationYears, aggressorPop, aggressorName, aggressorGdp, targetName, targetGdp }: Props) {
  if (!result) {
    return (
      <Panel title="COST ANALYSIS">
        <p className="t-data fg-dim">&gt; AWAITING PARAMETERS <BlinkCursor /></p>
      </Panel>
    );
  }

  const { total, breakdown } = result;
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
      </div>
    </Panel>
  );
}
