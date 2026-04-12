'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PersonMemorialCanvas } from '@/components/terminal/PersonMemorialCanvas';

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  childRatio?: number;
  casualtyRatio?: number;
}

export function MemorialImmersiveOverlay({
  open,
  onClose,
  total,
  childRatio = 0.4,
  casualtyRatio = 0.005,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Auto-scroll: scroll total canvas height in ~90 seconds.
  // Respects prefers-reduced-motion.
  useEffect(() => {
    if (!open) return;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reducedMotion) return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    // We need the inner scrollable div — it's the first child of wrap
    const scroller = wrap.querySelector<HTMLDivElement>('[data-scroller]');
    if (!scroller) return;

    const scrollHeight = scroller.scrollHeight;
    const rate = scrollHeight / 90; // px per second
    let last: number | null = null;

    const tick = (now: number) => {
      if (last === null) last = now;
      const delta = (now - last) / 1000;
      last = now;
      scroller.scrollTop = Math.min(
        scroller.scrollTop + rate * delta,
        scroller.scrollHeight - scroller.clientHeight
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  if (!open) return null;

  const canvasHeight =
    typeof window !== 'undefined' ? window.innerHeight - 120 : 600;

  return (
    <div
      ref={wrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Person memorial — every icon is one person"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--s-3) var(--s-4)',
          borderBottom: '1px solid var(--fg-mute)',
          flexShrink: 0,
        }}
      >
        <span className="t-title fg-alert">
          EVERY ICON IS ONE PERSON — SCROLL TO GRIEVE
        </span>
        <button
          className="t-label fg-dim"
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid var(--fg-mute)',
            color: 'inherit',
            padding: 'var(--s-1) var(--s-2)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label="Close memorial overlay"
        >
          [CLOSE]
        </button>
      </div>

      {/* Scrollable canvas area */}
      <div data-scroller style={{ flex: 1, overflow: 'auto' }}>
        <PersonMemorialCanvas
          total={total}
          childRatio={childRatio}
          casualtyRatio={casualtyRatio}
          height={canvasHeight}
        />
      </div>
    </div>
  );
}
