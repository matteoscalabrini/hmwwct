'use client';

import { useRouter } from 'next/navigation';
import { TerminalButton } from '@/components/terminal/TerminalButton';

export function Act3Call() {
  const router = useRouter();

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'var(--s-8) var(--s-7)',
      }}
    >
      <p className="t-title fg-phos" style={{ margin: 0 }}>
        &gt; ENOUGH READING.
      </p>
      <p className="t-title fg-phos" style={{ marginTop: 'var(--s-4)', marginBottom: 0 }}>
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
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--phosphor)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          METHODOLOGY
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="/sources"
          className="fg-dim"
          style={{ textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--phosphor)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          SOURCES
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/Okoku/hmwwct"
          target="_blank"
          rel="noopener noreferrer"
          className="fg-dim"
          style={{ textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--phosphor)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          GITHUB
        </a>
      </div>
    </section>
  );
}
