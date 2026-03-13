'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const BOOT_STEPS = [
  'Loading live macroeconomic feeds',
  'Indexing fallback conflict datasets',
  'Preparing fiscal and humanitarian models',
  'Syncing scenario presets',
  'System ready for analysis',
];

const BOOT_THRESHOLDS = [16, 34, 56, 78, 100];

export default function Home() {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(value + 4, 100);
        if (next >= 100) {
          window.clearInterval(id);
        }
        return next;
      });
    }, 85);

    return () => window.clearInterval(id);
  }, []);

  const completedSteps = BOOT_THRESHOLDS.filter((threshold) => progress >= threshold).length;
  const activeStep = completedSteps < BOOT_STEPS.length ? completedSteps : -1;

  return (
    <div className="grid-bg relative overflow-hidden">
      <section className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-screen-xl items-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="w-full space-y-8">
          <div className="max-w-5xl space-y-6">
            <p className="terminal-kicker" style={{ color: 'var(--accent-blue)' }}>
              Strategic Cost Analysis System
            </p>

            <h1
              className="font-display leading-[0.88] tracking-[0.08em]"
              style={{ fontSize: 'clamp(1.55rem, 7.1vw, 6rem)' }}
            >
              HOW MUCH WOULD
              <br />
              A WAR COST THERE?
            </h1>

            <p className="max-w-3xl text-base leading-8 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
              A stripped-back terminal for estimating the economic and humanitarian cost of interstate conflict using public data and transparent assumptions.
            </p>

            <p className="max-w-2xl text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              Live inputs where possible. Explicit fallbacks when necessary. Every major output is inspectable.
            </p>

            <p
              className="font-display whitespace-nowrap leading-none tracking-[0.1em] text-glow-red"
              style={{ color: 'var(--accent-red)', fontSize: 'clamp(1.15rem, 5vw, 3.4rem)' }}
            >
              THE ONLY WINNING MOVE IS NOT TO PLAY.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Link href="/calculator" className="terminal-button terminal-button-primary">
                &gt; Open Simulator
              </Link>
              <Link href="/methodology" className="terminal-button terminal-button-ghost">
                Read Methodology
              </Link>
            </div>

            <div className="terminal-panel-muted max-w-2xl px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <span className="terminal-kicker" style={{ color: 'var(--accent-cyan)' }}>
                  Boot Sequence
                </span>
                <span className="text-xs tabular-nums uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {String(progress).padStart(3, '0')}%
                </span>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-secondary)' }}>
                &gt; boot hmwwct --profile strategic-cost-analysis
                <span className="animate-blink ml-1">_</span>
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                  }}
                />
              </div>

              <div className="mt-5 space-y-2">
                {BOOT_STEPS.map((step, index) => {
                  const completed = progress >= BOOT_THRESHOLDS[index];
                  const active = index === activeStep;

                  return (
                    <div key={step} className="flex items-center gap-3 text-xs uppercase tracking-[0.14em]">
                      <span
                        className={active ? 'animate-pulse-dot' : ''}
                        style={{
                          color: completed ? 'var(--accent-emerald)' : active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        }}
                      >
                        {completed ? '[OK]' : active ? '[..]' : '[--]'}
                      </span>
                      <span
                        style={{
                          color: completed ? 'var(--text-secondary)' : active ? 'var(--text)' : 'var(--text-muted)',
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
