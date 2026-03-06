'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ConflictScenario, WarCostResult } from '@/types';
import { CountrySelector } from '@/components/CountrySelector';
import { ScenarioSelector } from '@/components/ScenarioSelector';
import { CostBreakdown } from '@/components/CostBreakdown';
import { CostChart } from '@/components/CostChart';
import { OpportunityCost } from '@/components/OpportunityCost';
import { HumanTollBanner } from '@/components/HumanTollBanner';
import { ShareButton } from '@/components/ShareButton';
import { DataFreshnessIndicator } from '@/components/DataFreshnessIndicator';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatCurrencyRange, formatDuration } from '@/lib/utils/formatting';

const LOADING_LINES = [
  'ACCESSING WORLD BANK DATABASE...',
  'LOADING SIPRI MILITARY EXPENDITURE DATA...',
  'VERIFYING FIGURES THAT DEFENSE MINISTRIES PREFER YOU DIDN\'T KNOW...',
  'RUNNING WATSON INSTITUTE COST MODEL (FUNDED BY NO DEFENSE CONTRACTOR)...',
  'CALCULATING HUMANITARIAN PROJECTIONS (THE PART THAT DOESN\'T FIT IN A PRESS RELEASE)...',
  'THE MATH IS SIMPLE. THE DECISION, APPARENTLY, IS NOT.',
];

function CalculatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [aggressorCode, setAggressorCode] = useState<string | null>(searchParams.get('aggressor'));
  const [targetCode, setTargetCode] = useState<string | null>(searchParams.get('target'));
  const [scenario, setScenario] = useState<ConflictScenario | null>(
    (searchParams.get('scenario') as ConflictScenario) ?? null
  );
  const [result, setResult] = useState<WarCostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (aggressorCode) params.set('aggressor', aggressorCode);
    if (targetCode) params.set('target', targetCode);
    if (scenario) params.set('scenario', scenario);
    router.replace(`/calculator?${params.toString()}`, { scroll: false });
  }, [aggressorCode, targetCode, scenario, router]);

  useEffect(() => {
    if (!aggressorCode || !targetCode || !scenario) return;
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggressorCode, targetCode, scenario]);

  const handleCalculate = async () => {
    if (!aggressorCode || !targetCode || !scenario) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggressorCode, targetCode, scenario }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Calculation failed');
      }
      const data: WarCostResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const canCalculate = aggressorCode && targetCode && scenario;

  return (
    <div className="px-4 sm:px-10 py-10 space-y-10">

      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>
            WOPR // STRATEGIC COST ANALYSIS
          </p>
          <h1 className="text-2xl font-bold tracking-wider glow" style={{ color: 'var(--green)' }}>
            WAR COST CALCULATOR
          </h1>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            ALL ESTIMATES BASED ON REAL DATA FROM OFFICIAL SOURCES. EVERY NUMBER IS CITED.
            COSTS ARE CONSERVATIVE — ACTUAL CONFLICTS ALWAYS RUN OVER BUDGET.
          </p>
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
          <p>REMEMBER: THESE FIGURES ARE USUALLY PREPARED.</p>
          <p>THEY ARE RARELY RELEASED.</p>
        </div>
      </div>

      {/* Inputs — two columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Step 1 */}
        <section className="space-y-3">
          <div>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
              &gt; STEP 01 // SELECT NATIONS
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              // the initiating party is never called the aggressor, officially
            </p>
          </div>
          <CountrySelector
            aggressorCode={aggressorCode}
            targetCode={targetCode}
            onAggressorChange={setAggressorCode}
            onTargetChange={setTargetCode}
          />
        </section>

        {/* Step 2 */}
        <section className="space-y-3">
          <div>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
              &gt; STEP 02 // SELECT CONFLICT TYPE
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              // duration always optimistic in the initial briefing
            </p>
          </div>
          <ScenarioSelector value={scenario} onChange={setScenario} />
        </section>
      </div>

      {/* Manual calculate button */}
      {canCalculate && !loading && !result && (
        <div className="space-y-2">
          <button
            onClick={handleCalculate}
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
            className="px-8 py-3 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            &gt; INITIATE ANALYSIS
          </button>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            // results will include military, economic, humanitarian, and reconstruction costs. all cited.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-5 space-y-1.5 text-xs">
            {LOADING_LINES.map((line, i) => (
              <p
                key={i}
                className={i === 0 ? 'cursor' : ''}
                style={{ color: i < 2 ? 'var(--green-dim)' : 'var(--text-dim)' }}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ border: '1px solid var(--red)', background: 'rgba(255,68,68,0.05)' }} className="p-5">
          <p className="text-xs font-bold tracking-widest uppercase glow-red mb-2" style={{ color: 'var(--red)' }}>
            ⚠ SYSTEM ERROR
          </p>
          <p className="text-xs" style={{ color: 'var(--red)', opacity: 0.85 }}>{error}</p>
          <button
            onClick={handleCalculate}
            className="mt-3 text-xs underline tracking-widest uppercase"
            style={{ color: 'var(--red)' }}
          >
            &gt; RETRY
          </button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-8">

          {/* Total cost hero — full width */}
          <div style={{ border: '1px solid var(--green-dim)', background: 'var(--panel)' }} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                  TOTAL PROJECTED COST // POINT ESTIMATE
                </p>
                <div className="text-5xl sm:text-6xl font-bold glow tabular-nums" style={{ color: 'var(--green)' }}>
                  {formatCurrency(result.total.point)}
                </div>
                <p className="text-xs" style={{ color: 'var(--green-dim)' }}>
                  RANGE: {formatCurrencyRange(result.total.min, result.total.max)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  EST. DURATION: {formatDuration(result.duration.min)} – {formatDuration(result.duration.max)}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  NO SUCH BRIEFING WAS PREPARED FOR THE PUBLIC.
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  COSTS ALWAYS UNDERESTIMATED. WE TRIED TO COMPENSATE.
                  ACTUAL OUTCOMES VARY. ALWAYS UPWARD.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <ShareButton aggressorCode={aggressorCode!} targetCode={targetCode!} scenario={scenario!} />
                  <button
                    onClick={() => { setResult(null); setError(null); }}
                    className="text-xs tracking-widest uppercase hover:text-[var(--green)] transition-colors"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    &gt; RESET
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid — 3 columns with sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: breakdown + human toll */}
            <div className="lg:col-span-2 space-y-6">
              <HumanTollBanner toll={result.humanToll} />
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--green-dim)' }}>
                  &gt; COST BREAKDOWN BY CATEGORY
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  // click any category to see methodology and line items
                </p>
                <CostBreakdown categories={result.breakdown} />
              </div>
            </div>

            {/* Right: chart + opportunity cost */}
            <div className="space-y-6">
              <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-5">
                <CostChart result={result} />
              </div>
              <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-5">
                <OpportunityCost items={result.opportunityCosts} totalUsd={result.total.point} />
              </div>
            </div>
          </div>

          <DataFreshnessIndicator
            dataFreshness={result.dataFreshness}
            hasStaticFallback={result.breakdown.military.items.some((i) => !i.assumptions[0])}
          />
        </div>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs tracking-widest uppercase cursor" style={{ color: 'var(--text-dim)' }}>
        LOADING SYSTEM
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
