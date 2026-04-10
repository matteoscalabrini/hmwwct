'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Key } from './Key';
import { useHotkey } from '@/lib/terminal/useHotkey';

interface HeaderProps {
  currentPath: string;
}

const NAV = [
  { hotkey: '/', path: '/', label: 'HOME' },
  { hotkey: 'c', path: '/calculator', label: 'CALCULATOR' },
  { hotkey: 'm', path: '/methodology', label: 'METHODOLOGY' },
];

export function Header({ currentPath }: HeaderProps) {
  const router = useRouter();

  // Three explicit hook calls (not in a loop — hooks rules)
  useHotkey('/', () => router.push('/'));
  useHotkey('c', () => router.push('/calculator'));
  useHotkey('m', () => router.push('/methodology'));

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-h)',
        borderBottom: 'var(--border-1)',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--frame-pad)',
        zIndex: 40,
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-3)', textDecoration: 'none' }}>
        <span className="fg-phos" style={{ fontSize: 'var(--t-title)', fontWeight: 700, lineHeight: 1 }}>HMWWCT</span>
        <span className="t-label fg-dim" aria-hidden="true">▸</span>
        <span className="t-label fg-dim">HOW MUCH WOULD A WAR COST THERE</span>
      </Link>
      <nav style={{ display: 'flex', gap: 'var(--s-4)' }}>
        {NAV.map((item) => {
          const active = item.path === currentPath;
          return (
            <Link key={item.path} href={item.path} data-active={active || undefined}
              style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5ch', textDecoration: 'none' }}>
              <Key active={active}>{item.hotkey.toUpperCase()}</Key>
              <span className="t-label" style={{ color: active ? 'var(--phosphor)' : 'var(--fg-dim)' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
