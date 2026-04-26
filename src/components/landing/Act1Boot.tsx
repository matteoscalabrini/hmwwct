'use client';

import { BlinkCursor } from '@/components/terminal/BlinkCursor';

export function Act1Boot() {
  return (
    <section
      className="landing-hero"
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
      <a
        href="#weight-data"
        className="landing-scroll-cue"
        aria-label="Scroll down for more data and the calculator"
      >
        <span
          className="landing-scroll-cue__icon"
          aria-hidden="true"
        >
          ↓
        </span>
        <span className="landing-scroll-cue__text">
          <span className="t-label">MORE BELOW</span>
          <span className="t-label fg-dim">DATA + CALCULATOR</span>
        </span>
      </a>
    </section>
  );
}
