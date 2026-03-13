'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ConflictScenario, OpportunityContextResponse, WarCostResult } from '@/types';
import { CountrySelector } from '@/components/CountrySelector';
import { ScenarioSelector } from '@/components/ScenarioSelector';
import { CostBreakdown } from '@/components/CostBreakdown';
import { CostChart } from '@/components/CostChart';
import { OpportunityCost } from '@/components/OpportunityCost';
import { OpportunityGravityPanel } from '@/components/OpportunityGravityPanel';
import { HumanTollBanner } from '@/components/HumanTollBanner';
import { DataFreshnessIndicator } from '@/components/DataFreshnessIndicator';
import { RevenuePanel } from '@/components/RevenuePanel';
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
  const [visibleLoadingLines, setVisibleLoadingLines] = useState(0);
  const [displayedPoint, setDisplayedPoint] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showOpportunityContext, setShowOpportunityContext] = useState(false);
  const [opportunityContext, setOpportunityContext] = useState<OpportunityContextResponse | null>(null);
  const [opportunityContextLoading, setOpportunityContextLoading] = useState(false);
  const [opportunityContextError, setOpportunityContextError] = useState<string | null>(null);
  const rafRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const opportunityAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    if (opportunityAbortRef.current) {
      opportunityAbortRef.current.abort();
      opportunityAbortRef.current = null;
    }
    setShowOpportunityContext(false);
    setOpportunityContext(null);
    setOpportunityContextError(null);
    setOpportunityContextLoading(false);
  }, [targetCode]);

  // Keyboard shortcuts: [1/2/3] scenario, [Esc] reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setScenario('skirmish');
      else if (e.key === '2') setScenario('conventional');
      else if (e.key === '3') setScenario('occupation');
      else if (e.key === 'Escape') { setResult(null); setError(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sequential loading lines
  useEffect(() => {
    if (!loading) { setVisibleLoadingLines(0); return; }
    setVisibleLoadingLines(1);
    const id = setInterval(() => {
      setVisibleLoadingLines(n => {
        if (n >= LOADING_LINES.length) { clearInterval(id); return n; }
        return n + 1;
      });
    }, 480);
    return () => clearInterval(id);
  }, [loading]);

  // Animated count-up when result arrives
  useEffect(() => {
    if (!result) { setDisplayedPoint(0); return; }
    const target = result.total.point;
    const duration = 2200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedPoint(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [result?.total.point]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCalculate = async () => {
    if (!aggressorCode || !targetCode || !scenario) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    // Smooth progress bar: accelerates to ~85% then slows, never reaches 100% until done
    const progressStart = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - progressStart) / 1000;
      // asymptotic curve: approaches 90% over ~20s
      setLoadingProgress(Math.min(90, 90 * (1 - Math.exp(-elapsed / 6))));
    }, 200);

    try {
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggressorCode, targetCode, scenario }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Calculation failed');
      }
      setLoadingProgress(100);
      const data: WarCostResult = await res.json();
      setResult(data);
    } catch (err) {
      if (controller.signal.aborted) {
        // If aborted by a newer request, don't show error
        if (abortRef.current !== controller) return;
        setError('Request timed out — the data source may be slow. Try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      }
    } finally {
      clearInterval(progressInterval);
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleRevealGravity = async () => {
    if (!targetCode) return;

    setShowOpportunityContext(true);
    if (opportunityContext || opportunityContextLoading) return;

    if (opportunityAbortRef.current) opportunityAbortRef.current.abort();
    const controller = new AbortController();
    opportunityAbortRef.current = controller;

    setOpportunityContextLoading(true);
    setOpportunityContextError(null);

    try {
      const res = await fetch(`/api/opportunity-context?target=${targetCode}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Opportunity context lookup failed');
      }

      const data: OpportunityContextResponse = await res.json();
      if (opportunityAbortRef.current !== controller) return;
      setOpportunityContext(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setOpportunityContextError(err instanceof Error ? err.message : 'Opportunity context lookup failed');
    } finally {
      if (opportunityAbortRef.current === controller) {
        opportunityAbortRef.current = null;
        setOpportunityContextLoading(false);
      }
    }
  };

  const canCalculate = aggressorCode && targetCode && scenario;

  return (
    <div className="px-5 py-6 space-y-6">

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
              The initiating party is never called the aggressor, officially.
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--green-dim)' }}>
                &gt; STEP 02 // SELECT CONFLICT TYPE
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Duration is always optimistic in the initial briefing.
              </p>
            </div>
            <p className="text-xs shrink-0 tracking-widest" style={{ color: 'var(--text-muted)' }}>
              [1] [2] [3]
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
            Results include military, economic, humanitarian, and reconstruction modules, all cited.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          <div style={{ border: '1px solid var(--border)', background: 'var(--panel)' }} className="p-5 space-y-3 text-xs">
            {LOADING_LINES.slice(0, visibleLoadingLines).map((line, i) => (
              <p
                key={i}
                className={`reveal-line${i === visibleLoadingLines - 1 ? ' cursor' : ''}`}
                style={{ color: i < 2 ? 'var(--green-dim)' : 'var(--text-dim)' }}
              >
                {line}
              </p>
            ))}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: 'var(--green-dim)' }} className="tracking-widest">PROGRESS</span>
                <span style={{ color: 'var(--green)' }} className="tabular-nums">{Math.round(loadingProgress)}%</span>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', height: '4px' }}>
                <div
                  style={{
                    background: 'var(--green)',
                    width: `${loadingProgress}%`,
                    height: '100%',
                    transition: 'width 0.3s ease-out',
                    boxShadow: '0 0 8px var(--green)',
                  }}
                />
              </div>
            </div>
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
        <div className="space-y-8 access-granted">

          {/* Cost + Impact + Revenue + Net — four-column hero */}
          <div style={{ border: '1px solid var(--green-dim)', background: 'var(--panel)' }} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">

              {/* Col 1: Total cost */}
              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                  TOTAL PROJECTED COST
                </p>
                <div
                  className="text-4xl sm:text-5xl font-bold tabular-nums count-shimmer"
                  style={{ color: 'var(--green)' }}
                >
                  {formatCurrency(displayedPoint)}
                </div>
                <p className="text-xs" style={{ color: 'var(--green-dim)' }}>
                  RANGE: {formatCurrencyRange(result.total.min, result.total.max)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {formatDuration(result.duration.min)} – {formatDuration(result.duration.max)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  MILITARY + HUMANITARIAN + RECONSTRUCTION
                </p>
              </div>

              {/* Col 2: Economic impact */}
              <div className="space-y-2" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                  ECONOMIC IMPACT
                </p>
                <div className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: 'var(--amber)' }}>
                  {formatCurrency(result.economicImpact.point)}
                </div>
                <p className="text-xs" style={{ color: 'var(--amber)' }}>
                  RANGE: {formatCurrencyRange(result.economicImpact.min, result.economicImpact.max)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  SHOWN SEPARATELY FROM HEADLINE COST
                </p>
              </div>

              {/* Col 3: Best-case revenue */}
              <div className="space-y-2" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                  BEST-CASE REVENUE
                </p>
                <div className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: 'var(--green-dim)' }}>
                  {formatCurrency(result.revenue.totalUsd)}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  BREAK-EVEN:{' '}
                  {result.revenue.breakEvenYears === null || result.revenue.breakEvenYears > 500
                    ? 'NEVER'
                    : `${result.revenue.breakEvenYears} YRS`}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Assumes full territorial control.
                </p>
              </div>

              {/* Col 4: Net position */}
              <div className="space-y-2" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                  NET POSITION
                </p>
                <div
                  className="text-4xl sm:text-5xl font-bold tabular-nums"
                  style={{ color: result.revenue.netPositionUsd >= 0 ? 'var(--green)' : 'var(--red)' }}
                >
                  {result.revenue.netPositionUsd >= 0 ? '+' : ''}{formatCurrency(result.revenue.netPositionUsd)}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  NO 21ST-CENTURY WAR HAS PAID FOR ITSELF. OR DID IT?
                </p>
              </div>
            </div>
            <div className="pt-6 mt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleRevealGravity}
                disabled={opportunityContextLoading}
                className="w-full px-5 py-5 sm:py-6 text-4xl sm:text-5xl leading-none font-bold tracking-[0.08em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  border: '1px solid var(--red)',
                  background: 'rgba(255,68,68,0.10)',
                  color: 'var(--red)',
                  boxShadow: '0 0 18px rgba(255,68,68,0.08)',
                }}
              >
                {opportunityContextLoading
                  ? 'LOADING THE SCALE OF THESE COSTS'
                  : 'I DO NOT UNDERSTAND THE GRAVITY OF THESE COSTS'}
              </button>
            </div>
          </div>

          {showOpportunityContext && (
            <OpportunityGravityPanel
              metrics={opportunityContext?.metrics ?? []}
              items={result.opportunityCosts}
              loading={opportunityContextLoading}
              error={opportunityContextError}
            />
          )}

          {/* Revenue detail — full width, directly below the hero */}
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--green-dim)' }}>
              &gt; ESTIMATED REVENUE // BEST-CASE BREAKDOWN
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Assumes the aggressor wins and maintains full control; read assumptions before interpreting.
            </p>
            <RevenuePanel revenue={result.revenue} projectedCostUsd={result.total.point} />
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
                  Economic impact is broken out in the header; click any category to inspect the model.
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
                <OpportunityCost items={result.opportunityCosts} />
              </div>
            </div>
          </div>

          <DataFreshnessIndicator
            dataFreshness={result.dataFreshness}
            hasStaticFallback={result.dataFreshness.worldBank.toLowerCase().includes('static fallback')}
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
