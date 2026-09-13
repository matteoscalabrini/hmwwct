'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Image from 'next/image';
import { filterMatches, SelectOption } from '@/lib/terminal/filterMatches';
import { BlinkCursor } from './BlinkCursor';

interface TerminalSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function TerminalSelect({ label, value, options, onChange }: TerminalSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = filterMatches(options, query);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const openMenu = () => {
    setQuery('');
    setCursor(0);
    setOpen(true);
  };

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery.toUpperCase());
    setCursor(0);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[cursor]) commit(matches[cursor].value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openMenu}
        aria-label={label}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'var(--s-1)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span className="t-label fg-dim">{label}</span>
        <span className="fg" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <span aria-hidden="true" className="fg-dim">▼ </span>
          {selected?.flag && (
            <Image
              src={selected.flag}
              alt=""
              width={16}
              height={11}
              unoptimized
              style={{ width: 16, height: 11, objectFit: 'cover', border: '1px solid var(--fg-mute)', flexShrink: 0 }}
            />
          )}
          {selected?.label ?? '—'}
        </span>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      <div className="t-label fg-dim">{label} · SEARCH</div>
      <div
        style={{
          border: '1px solid var(--accent)',
          background: 'var(--bg)',
          padding: 'var(--s-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--s-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5ch' }}>
          <span className="fg-accent" aria-hidden="true">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="SEARCH"
            className="t-data fg"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: '"Ioskeley Mono", monospace',
              textTransform: 'uppercase',
            }}
          />
          <BlinkCursor />
        </div>
        <ul
          role="listbox"
          aria-label={label}
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--s-1)',
            maxHeight: 'min(320px, 45vh)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {matches.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => commit(opt.value)}
              className="t-data"
              style={{
                padding: 'var(--s-2) var(--s-3)',
                cursor: 'pointer',
                background: i === cursor ? 'var(--accent)' : 'transparent',
                color: i === cursor ? 'var(--bg)' : 'var(--fg)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                {opt.flag && (
                  <Image
                    src={opt.flag}
                    alt=""
                    loading="lazy"
                    width={16}
                    height={11}
                    unoptimized
                    style={{ width: 16, height: 11, objectFit: 'cover', border: '1px solid var(--fg-mute)', flexShrink: 0 }}
                  />
                )}
                {opt.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
