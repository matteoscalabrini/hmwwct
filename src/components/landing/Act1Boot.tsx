'use client';

import { BlinkCursor } from '@/components/terminal/BlinkCursor';

export function Act1Boot() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--s-8) var(--s-7)',
        position: 'relative',
      }}
    >
      {/* Hero heading */}
      <h1
        className="t-hero fg-phos"
        style={{ margin: 0, textAlign: 'left' }}
      >
        HOW MUCH
        <br />
        WOULD A WAR
        <br />
        COST THERE?<BlinkCursor />
      </h1>

      {/* Subheading */}
      <p
        className="t-body fg-dim"
        style={{ marginTop: 'var(--s-7)', marginBottom: 0 }}
      >
        &gt; A TERMINAL FOR COUNTING WHAT WARS DESTROY.
      </p>

      {/* Scroll hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--s-7)',
          left: 'var(--s-7)',
        }}
      >
        <span
          className="t-label fg-dim"
          style={{
            animation: 'blink 1.4s steps(2, start) infinite',
          }}
          aria-label="Scroll down to begin"
        >
          ↓ BEGIN
        </span>
      </div>
    </section>
  );
}
