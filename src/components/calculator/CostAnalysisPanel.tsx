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

interface CategoryValue {
  min?: number | null;
  max?: number | null;
  point?: number | null;
  amount?: number | null;
  amountMin?: number | null;
  amountMax?: number | null;
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
    military: CategoryValue;
    economic: CategoryValue;
    humanitarian: CategoryValue;
    reconstruction: CategoryValue;
    armaments?: CategoryValue;
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

function resolveCategoryPoint(category: CategoryValue): number {
  const value = category.point ?? category.amount ?? 0;
  return Number.isFinite(value) ? value : 0;
}

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
  const militaryPoint = resolveCategoryPoint(breakdown.military);
  const economicPoint = resolveCategoryPoint(breakdown.economic);
  const humanitarianPoint = resolveCategoryPoint(breakdown.humanitarian);
  const reconstructionPoint = resolveCategoryPoint(breakdown.reconstruction);
  const armamentsPoint = breakdown.armaments ? resolveCategoryPoint(breakdown.armaments) : null;

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

        <p className="t-label fg-dim" style={{ margin: 0 }}>
          DIRECT COST COMPONENTS
        </p>

        <DataTable>
          <DataTable.Row
            label="MILITARY"
            value={formatCompactUsd(militaryPoint)}
            footnote={buildObituary('military', militaryPoint, obituaryCtx)}
          />
          {armamentsPoint !== null && (
            <DataTable.Row
              label="ARMAMENTS"
              value={formatCompactUsd(armamentsPoint)}
            />
          )}
          <DataTable.Row
            label="HUMANITARIAN"
            value={formatCompactUsd(humanitarianPoint)}
            tone="alert"
            footnote={buildObituary('humanitarian', humanitarianPoint, obituaryCtx)}
          />
          <DataTable.Row
            label="RECONSTRUCTION"
            value={formatCompactUsd(reconstructionPoint)}
            footnote={buildObituary('reconstruction', reconstructionPoint, obituaryCtx)}
          />
        </DataTable>

        <AsciiRule />

        <p className="t-label fg-dim" style={{ margin: 0 }}>
          SEPARATE SYSTEMIC IMPACT
        </p>

        <DataTable>
          <DataTable.Row
            label="ECONOMIC"
            value={formatCompactUsd(economicPoint)}
            footnote={buildObituary('economic', economicPoint, obituaryCtx)}
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
