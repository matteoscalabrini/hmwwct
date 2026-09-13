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
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        <span className="site-header__logo">HMWWCT</span>
        <span className="t-label fg-dim site-header__subtitle" aria-hidden="true">
          HOW MUCH WOULD A WAR COST THERE
        </span>
      </Link>
      <nav className="site-header__nav" aria-label="Primary">
        {NAV.map((item) => {
          const active = item.path === currentPath;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="site-header__link"
              data-active={active || undefined}
              aria-current={active ? 'page' : undefined}
            >
              <span className="site-header__hotkey" aria-hidden="true">
                <Key active={active}>{item.hotkey.toUpperCase()}</Key>
              </span>
              <span className="t-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
