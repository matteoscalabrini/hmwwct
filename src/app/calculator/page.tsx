'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ConflictScenario, OpportunityContextResponse, WarCostResult, OpportunityCostItem } from '@/types';
import WorldMap from '@/components/WorldMap';
import { CountrySelector } from '@/components/CountrySelector';
import { ScenarioSelector } from '@/components/ScenarioSelector';
import { CostBreakdown } from '@/components/CostBreakdown';
import { CostChart } from '@/components/CostChart';
import { HumanTollBanner } from '@/components/HumanTollBanner';
import { DataFreshnessIndicator } from '@/components/DataFreshnessIndicator';
import { RevenuePanel } from '@/components/RevenuePanel';
import { BudgetReallocation } from '@/components/BudgetReallocation';
import { CostPerTaxpayer } from '@/components/CostPerTaxpayer';
import { GdpComparisonPanel } from '@/components/GdpComparisonPanel';
import { ShareButton } from '@/components/ShareButton';
import { formatCurrency, formatCurrencyRange, formatDuration, formatNumber } from '@/lib/utils/formatting';
import { STRONG_OPPORTUNITY_ID_SET } from '@/constants/opportunity-focus';
import { OPPORTUNITY_ICONS, OPPORTUNITY_ID_ICON_FALLBACKS } from '@/lib/utils/opportunity-icons';
import { Heart, ArrowRightLeft, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Country info type (fetched from /api/countries on mount)
// ---------------------------------------------------------------------------

interface BasicCountryInfo {
  code: string;
  name: string;
  population: number | null;
  gdp: number | null;
}

interface ResultInputs {
  aggressorGdp: number | null;
  aggressorPopulation: number | null;
  targetGdp: number | null;
  targetPopulation: number | null;
  aggressorName: string;
  targetName: string;
}

// ---------------------------------------------------------------------------
// Live cost ticker (kept, restyled)
// ---------------------------------------------------------------------------

function LiveCostTicker({ totalCost, durationYears }: { totalCost: number; durationYears: number }) {
  const [elapsed, setElapsed] = useState(0);
  const ratePerSecond = totalCost / Math.max(durationYears * 365, 1) / 86400;

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const accumulated = elapsed * ratePerSecond;

  return (
    <div className="terminal-panel space-y-4 px-5 py-5">
      <p className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
        Cost accumulating since you opened this view
      </p>
      <div className="fs-number font-bold tabular-nums font-mono" style={{ color: 'var(--accent-cyan)' }}>
        {formatCurrency(accumulated)}
      </div>
      <p className="text-xs tabular-nums font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--text-secondary)' }}>
        {formatCurrency(ratePerSecond)}/sec
        {' \u00B7 '}
        {formatCurrency(ratePerSecond * 60)}/min
        {' \u00B7 '}
        {formatCurrency(ratePerSecond * 3600)}/hr
        {' \u00B7 '}
        {formatCurrency(ratePerSecond * 86400)}/day
      </p>
      <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
        Projected total spread evenly across the full conflict duration.
        Actual spending is front-loaded — early months cost significantly more.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result tab types
// ---------------------------------------------------------------------------

type ResultTab = 'breakdown' | 'budget' | 'personal' | 'scale' | 'revenue';

const TABS: { id: ResultTab; label: string }[] = [
  { id: 'breakdown', label: 'Cost Breakdown' },
  { id: 'budget',    label: 'Budget Impact' },
  { id: 'personal',  label: 'Personal Cost' },
  { id: 'scale',     label: 'What It Could Buy' },
  { id: 'revenue',   label: 'Revenue' },
];

// ---------------------------------------------------------------------------
// Main calculator component
// ---------------------------------------------------------------------------

function CalculatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- core inputs ---
  const [aggressorCode, setAggressorCode] = useState<string | null>(searchParams.get('aggressor'));
  const [targetCode, setTargetCode] = useState<string | null>(searchParams.get('target'));
  const [scenario, setScenario] = useState<ConflictScenario | null>(
    (searchParams.get('scenario') as ConflictScenario) ?? null,
  );

  // --- map selection mode ---
  const [selectionMode, setSelectionMode] = useState<'aggressor' | 'target'>('aggressor');

  // --- results ---
  const [result, setResult] = useState<(WarCostResult & { inputs?: ResultInputs }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // --- display ---
  const [displayedPoint, setDisplayedPoint] = useState(0);
  const [activeTab, setActiveTab] = useState<ResultTab>('breakdown');

  // --- opportunity context ---
  const [opportunityContext, setOpportunityContext] = useState<OpportunityContextResponse | null>(null);
  const [opportunityContextLoading, setOpportunityContextLoading] = useState(false);
  const [opportunityContextError, setOpportunityContextError] = useState<string | null>(null);

  // --- country data ---
  const [countries, setCountries] = useState<BasicCountryInfo[]>([]);

  // --- refs ---
  const rafRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const opportunityAbortRef = useRef<AbortController | null>(null);
  const scaleTabFetchedRef = useRef<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [resultsVisible, setResultsVisible] = useState(false);

  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setResultsVisible(entry.isIntersecting), { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [result]);

  // --- derived (prefer result.inputs which has real GDP from World Bank) ---
  const aggressorGdp = result?.inputs?.aggressorGdp ?? countries.find(c => c.code === aggressorCode)?.gdp ?? 0;
  const aggressorPop = result?.inputs?.aggressorPopulation ?? countries.find(c => c.code === aggressorCode)?.population ?? 0;
  const aggressorName = result?.inputs?.aggressorName ?? countries.find(c => c.code === aggressorCode)?.name ?? aggressorCode ?? 'Aggressor';
  const targetName = result?.inputs?.targetName ?? countries.find(c => c.code === targetCode)?.name ?? targetCode ?? 'Target';

  // Fetch country list on mount
  useEffect(() => {
    fetch('/api/countries')
      .then(res => res.ok ? res.json() : [])
      .then((data: Array<{ cca3?: string; code?: string; name: { common: string } | string; population?: number; gdp?: number | null }>) => {
        const mapped: BasicCountryInfo[] = data.map((c) => ({
          code: (c.cca3 ?? c.code ?? '') as string,
          name: typeof c.name === 'string' ? c.name : c.name?.common ?? '',
          population: c.population ?? null,
          gdp: (c as Record<string, unknown>).gdp as number | null ?? null,
        }));
        setCountries(mapped);
      })
      .catch(() => {/* degrade gracefully */});
  }, []);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (aggressorCode) params.set('aggressor', aggressorCode);
    if (targetCode) params.set('target', targetCode);
    if (scenario) params.set('scenario', scenario);
    router.replace(`/calculator?${params.toString()}`, { scroll: false });
  }, [aggressorCode, targetCode, scenario, router]);

  // Auto-calculate when all inputs are set
  useEffect(() => {
    if (!aggressorCode || !targetCode || !scenario) return;
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggressorCode, targetCode, scenario]);

  // Reset opportunity context when target changes
  useEffect(() => {
    if (opportunityAbortRef.current) {
      opportunityAbortRef.current.abort();
      opportunityAbortRef.current = null;
    }
    setOpportunityContext(null);
    setOpportunityContextError(null);
    setOpportunityContextLoading(false);
    scaleTabFetchedRef.current = null;
  }, [targetCode]);

  // Keyboard shortcuts: 1-4 for scenarios, Escape to reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setScenario('precision_strike');
      else if (e.key === '2') setScenario('skirmish');
      else if (e.key === '3') setScenario('conventional');
      else if (e.key === '4') setScenario('occupation');
      else if (e.key === 'Escape') { setResult(null); setError(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  // No auto-scroll — user clicks the arrow indicator instead

  // --- Map click handler ---
  const handleMapClick = useCallback((code: string) => {
    if (selectionMode === 'aggressor') {
      setAggressorCode(code);
      setSelectionMode('target');
    } else {
      if (code === aggressorCode) return; // can't attack yourself
      setTargetCode(code);
      setSelectionMode('aggressor');
    }
  }, [selectionMode, aggressorCode]);

  // --- Swap countries ---
  const handleSwap = useCallback(() => {
    const a = aggressorCode;
    const t = targetCode;
    setAggressorCode(t);
    setTargetCode(a);
  }, [aggressorCode, targetCode]);

  // --- Calculate ---
  const handleCalculate = async () => {
    if (!aggressorCode || !targetCode || !scenario) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    setActiveTab('breakdown');

    const progressStart = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - progressStart) / 1000;
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
        if (abortRef.current !== controller) return;
        setError('Request timed out — the data source may be slow. Try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      }
    } finally {
      clearInterval(progressInterval);
      if (abortRef.current === controller) setLoading(false);
    }
  };

  // --- Fetch opportunity context ---
  const fetchOpportunityContext = async (code: string) => {
    if (opportunityAbortRef.current) opportunityAbortRef.current.abort();
    const controller = new AbortController();
    opportunityAbortRef.current = controller;

    setOpportunityContextLoading(true);
    setOpportunityContextError(null);

    try {
      const res = await fetch(`/api/opportunity-context?target=${code}`, { signal: controller.signal });
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

  // --- Tab change ---
  const handleTabChange = (tab: ResultTab) => {
    setActiveTab(tab);
    if (tab === 'scale' && targetCode && scaleTabFetchedRef.current !== targetCode) {
      scaleTabFetchedRef.current = targetCode;
      fetchOpportunityContext(targetCode);
    }
  };

  const canCalculate = aggressorCode && targetCode && scenario;

  const topOpportunityItem: OpportunityCostItem | null = result
    ? (result.opportunityCosts.find(i => STRONG_OPPORTUNITY_ID_SET.has(i.id) && i.quantity >= 1) ?? null)
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ================================================================== */}
      {/* TOP SECTION: Map + Side Panel                                      */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 px-3 py-3 sm:px-4 lg:flex-row lg:px-6 lg:py-5 lg:h-[calc(100vh-5.5rem)] lg:overflow-hidden">

        {/* --- MAP AREA --- */}
        <div className="relative min-h-[52vh] sm:min-h-[55vh] lg:min-h-0 flex-1 overflow-hidden scanlines" style={{ paddingTop: '30px' }}>
          <WorldMap
            aggressorCode={aggressorCode}
            targetCode={targetCode}
            onCountryClick={handleMapClick}
            resultMode={!!result}
            totalCost={result?.total.point}
          />

          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 pointer-events-none" style={{ zIndex: 2 }}>
            <div
              className="flex items-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: selectionMode === 'aggressor' ? 'var(--aggressor)' : 'var(--target)' }}
            >
              <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 mr-1.5 sm:mr-2 animate-pulse-dot" style={{
                background: selectionMode === 'aggressor' ? 'var(--aggressor)' : 'var(--target)',
              }} />
              <span className="hidden sm:block">
                {selectionMode === 'aggressor' ? 'SELECT AGGRESSOR' : 'SELECT TARGET'}
              </span>
            </div>
          </div>

          {result && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3" style={{ zIndex: 2 }}>
              <DataFreshnessIndicator
                dataFreshness={result.dataFreshness}
                hasStaticFallback={result.dataFreshness.worldBank.toLowerCase().includes('static fallback')}
              />
            </div>
          )}
        </div>

        <div className="lg:w-[360px] xl:w-[400px] shrink-0 overflow-y-auto lg:self-stretch">
          <div className="space-y-4 sm:space-y-5 px-3 py-3 sm:px-4 sm:py-4">

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="classification-label"
                >
                  CONTROL PANEL
                </span>
              </div>
              <p className="text-xs mt-2 leading-6" style={{ color: 'var(--text-muted)' }}>
                Real data from official sources. Every number cited.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                Countries
              </label>
              <CountrySelector
                aggressorCode={aggressorCode}
                targetCode={targetCode}
                onAggressorChange={(code) => {
                  setAggressorCode(code);
                  if (code) setSelectionMode('target');
                }}
                onTargetChange={(code) => {
                  setTargetCode(code);
                  if (code) setSelectionMode('aggressor');
                }}
              />
              {aggressorCode && targetCode && (
                <button
                  onClick={handleSwap}
                  className="terminal-button terminal-button-subtle"
                >
                  <ArrowRightLeft size={12} />
                  SWAP
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                  Scenario
                </label>
                <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                  [1] [2] [3] [4]
                </span>
              </div>
              <ScenarioSelector value={scenario} onChange={setScenario} />
            </div>

            {canCalculate && !loading && !result && (
              <button
                onClick={handleCalculate}
                className="terminal-button terminal-button-danger w-full"
              >
                &gt; EXECUTE ANALYSIS
              </button>
            )}

            {loading && (
              <div className="terminal-panel-muted flex items-center gap-3 px-4 py-4">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                <div className="flex-1">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    ANALYZING...
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        background: 'var(--accent-cyan)',
                        width: `${loadingProgress}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            )}

            {error && (
              <div
                className="terminal-callout is-danger space-y-2 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-red)' }}>
                  ERROR: {error}
                </p>
                <button
                  onClick={handleCalculate}
                  className="terminal-button terminal-button-subtle terminal-button-ghost"
                  style={{ color: 'var(--accent-red)' }}
                >
                  [RETRY]
                </button>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  RESULT SUMMARY
                </p>
                <div className="flex items-end justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>TOTAL COST</span>
                  <span className="font-display text-3xl leading-none tracking-[0.08em] tabular-nums text-glow-cyan" style={{ color: 'var(--accent-cyan)' }}>
                    {formatCurrency(displayedPoint)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>DURATION</span>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatDuration(result.duration.min)} – {formatDuration(result.duration.max)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>DISPLACED</span>
                  <span className="text-sm tabular-nums text-glow-amber" style={{ color: 'var(--accent-amber)' }}>
                    {formatNumber(result.humanToll.displacedPersonsPoint)}
                  </span>
                </div>
                {scenario && (
                  <ShareButton aggressorCode={aggressorCode!} targetCode={targetCode!} scenario={scenario} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && !loading && !resultsVisible && (
        <button
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 group"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Scroll to cost analysis"
        >
          <span
            className="font-display uppercase tracking-[0.22em]"
            style={{ color: 'var(--accent-cyan)', fontSize: 'clamp(1rem, 4vw, 2rem)' }}
          >
            COST ANALYSIS
          </span>
          <svg
            width="48" height="48" viewBox="0 0 24 24" fill="none"
            style={{
              color: 'var(--accent-cyan)',
              animation: 'bounce-arrow 1.2s ease-in-out infinite',
            }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
        </button>
      )}

      {result && !loading && (
        <div ref={resultsRef} className="grid-bg animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-screen-2xl space-y-5">

            <div className="flex items-center gap-3 mb-2">
              <span className="classification-label">
                ANALYSIS COMPLETE
              </span>
              <div className="terminal-divider flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="terminal-stat px-4 py-4" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-muted)' }}>TOTAL COST</p>
                <p className="fs-number font-bold tabular-nums text-glow-cyan" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(displayedPoint)}
                </p>
                <p className="mt-2 text-xs tabular-nums uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrencyRange(result.total.min, result.total.max)}
                </p>
              </div>

              <div className="terminal-stat px-4 py-4" style={{ borderTop: '3px solid var(--accent-amber)' }}>
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-muted)' }}>ECON IMPACT</p>
                <p className="fs-number font-bold tabular-nums text-glow-amber" style={{ color: 'var(--accent-amber)' }}>
                  {formatCurrency(result.economicImpact.point)}
                </p>
                <p className="mt-2 text-xs tabular-nums uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrencyRange(result.economicImpact.min, result.economicImpact.max)}
                </p>
              </div>

              <div className="terminal-stat px-4 py-4" style={{ borderTop: '3px solid var(--accent-red)' }}>
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-muted)' }}>DISPLACED</p>
                <p className="fs-number font-bold tabular-nums text-glow-red" style={{ color: 'var(--accent-red)' }}>
                  {formatNumber(result.humanToll.displacedPersonsPoint)}
                </p>
                <p className="mt-2 text-xs tabular-nums uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                  {formatNumber(result.humanToll.displacedPersonsMin)} – {formatNumber(result.humanToll.displacedPersonsMax)}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-5 flex flex-wrap gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`terminal-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div>
              {activeTab === 'breakdown' && (
                <div className="space-y-6">
                  <HumanTollBanner toll={result.humanToll} />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text)' }}>
                      COST BREAKDOWN BY CATEGORY
                    </h3>
                    <p className="text-xs mb-4 leading-6" style={{ color: 'var(--text-muted)' }}>
                      Economic impact shown separately in the summary strip above.
                    </p>
                    <CostBreakdown categories={result.breakdown} />
                  </div>
                  <CostChart result={result} />
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text)' }}>
                    BUDGET REALLOCATION IMPACT
                  </h3>
                  <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                    How the conflict cost compares to domestic spending priorities.
                  </p>
                  <BudgetReallocation
                    totalCost={result.total.point}
                    durationYears={result.duration.point}
                    aggressorGdp={aggressorGdp}
                    aggressorName={aggressorName}
                  />
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text)' }}>
                    COST PER TAXPAYER
                  </h3>
                  <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                    What this conflict would cost each citizen of the aggressor country.
                  </p>
                  <CostPerTaxpayer
                    totalCost={result.total.point}
                    aggressorPopulation={aggressorPop}
                    aggressorGdp={aggressorGdp}
                    aggressorName={aggressorName}
                    durationYears={result.duration.point}
                  />
                </div>
              )}

              {activeTab === 'scale' && (
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text)' }}>
                    ALTERNATIVE EXPENDITURE ANALYSIS
                  </h3>
                  <LiveCostTicker
                    totalCost={result.total.point}
                    durationYears={result.duration.point}
                  />

                  {topOpportunityItem && (() => {
                    const Icon = OPPORTUNITY_ICONS[topOpportunityItem.iconName]
                      ?? OPPORTUNITY_ID_ICON_FALLBACKS[topOpportunityItem.id]
                      ?? Heart;
                    return (
                      <div
                        className="terminal-callout is-success flex items-center gap-5 px-5 py-5"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                          style={{ background: 'rgba(105, 209, 127, 0.16)' }}
                        >
                          <Icon size={24} style={{ color: 'var(--accent-emerald)' }} />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-4xl leading-none tracking-[0.08em]" style={{ color: 'var(--accent-emerald)' }}>
                              {formatNumber(topOpportunityItem.quantity)}
                            </span>
                            <span className="text-sm uppercase tracking-[0.12em]" style={{ color: 'var(--text-secondary)' }}>
                              {topOpportunityItem.unit}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                            {topOpportunityItem.label}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {opportunityContextLoading && (
                    <div className="terminal-panel-muted flex items-center gap-2 px-4 py-4">
                      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading comparison data...</span>
                    </div>
                  )}

                  {opportunityContextError && (
                    <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{opportunityContextError}</p>
                  )}

                  {opportunityContext && !opportunityContextLoading && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.opportunityCosts
                        .filter(item => item.quantity >= 1)
                        .map((item) => {
                          const Icon = OPPORTUNITY_ICONS[item.iconName]
                            ?? OPPORTUNITY_ID_ICON_FALLBACKS[item.id]
                            ?? Heart;
                          const contextMetric = opportunityContext.metrics.find(m => m.id === item.id);
                          return (
                            <div
                              key={item.id}
                              className="terminal-panel-muted flex items-center gap-4 px-4 py-4"
                            >
                              <Icon size={18} style={{ color: 'var(--accent-emerald)' }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--text)' }}>
                                    {formatNumber(item.quantity)}
                                  </span>
                                  <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-secondary)' }}>
                                    {item.unit}
                                  </span>
                                </div>
                                <p className="text-xs truncate uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                                {contextMetric && (
                                  <p className="mt-1 text-xs leading-6" style={{ color: 'var(--accent-cyan)' }}>
                                    {contextMetric.currentLabel}: {formatNumber(contextMetric.currentValue)} {contextMetric.currentUnit}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  <GdpComparisonPanel
                    totalCost={result.total.point}
                    targetName={targetName}
                  />
                </div>
              )}

              {activeTab === 'revenue' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text)' }}>
                    ESTIMATED REVENUE (BEST CASE)
                  </h3>
                  <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                    Assumes aggressor wins and maintains full territorial control. Read assumptions before interpreting.
                  </p>
                  <RevenuePanel revenue={result.revenue} projectedCostUsd={result.total.point} />
                </div>
              )}
              </div>
            </div>

            <div className="pb-4">
              <DataFreshnessIndicator
                dataFreshness={result.dataFreshness}
                hasStaticFallback={result.dataFreshness.worldBank.toLowerCase().includes('static fallback')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary
// ---------------------------------------------------------------------------

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading calculator...</span>
        </div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
