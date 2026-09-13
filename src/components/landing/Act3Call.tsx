'use client';

import { useRouter } from 'next/navigation';
import { TerminalButton } from '@/components/terminal/TerminalButton';

export function Act3Call() {
  const router = useRouter();

  return (
    <section className="landing-section">
      <p className="t-title fg-accent" style={{ margin: 0 }}>
        &gt; ENOUGH READING.
      </p>
      <p className="t-title fg-accent" style={{ marginTop: 'var(--s-4)', marginBottom: 0 }}>
        &gt; RUN THE NUMBERS YOURSELF.
      </p>

      <div style={{ marginTop: 'var(--s-7)' }}>
        <TerminalButton onClick={() => router.push('/calculator')}>
          LAUNCH CALCULATOR →
        </TerminalButton>
      </div>

      <div
        className="t-label fg-dim"
        style={{ marginTop: 'var(--s-7)', display: 'flex', gap: 'var(--s-4)' }}
      >
        <a
          href="/methodology"
          className="fg-dim"
          style={{ textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          METHODOLOGY
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/Okoku/hmwwct"
          target="_blank"
          rel="noopener noreferrer"
          className="fg-dim"
          style={{ textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          GITHUB
        </a>
      </div>
    </section>
  );
}
