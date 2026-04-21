'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { formatCount } from '@/lib/terminal/formatters';
import { buildSequence } from '@/lib/terminal/demographic-sequence';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const DOT_SIZE = 8;
const DOT_GAP = DOT_SIZE;
const COL_W = DOT_SIZE + DOT_GAP;
const ROW_H = DOT_SIZE + DOT_GAP;

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  childRatio?: number;
  casualtyRatio?: number;
}

const COLORS = ['#4aff7a', '#7a9585', '#ff3b3b']; // adult, child, casualty

export function MemorialImmersiveOverlay({
  open,
  onClose,
  total,
  childRatio = 0.4,
  casualtyRatio = 0.005,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const lastScrollRef = useRef(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const focusable = Array.from(wrap.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    wrapRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Precompute sequence once
  const seq = useMemo(() => {
    if (!open) return new Uint8Array(0);
    return buildSequence(total, childRatio, casualtyRatio);
  }, [open, total, childRatio, casualtyRatio]);

  // Virtual-scroll canvas painting
  useEffect(() => {
    if (!open) return;
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroller || !canvas) return;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = Math.floor(canvasW / COL_W) || 1;
    const rows = Math.ceil(total / cols);
    const totalH = rows * ROW_H;

    // Set spacer height for virtual scroll
    const spacer = scroller.firstElementChild as HTMLElement;
    if (spacer) spacer.style.height = `${totalH}px`;

    lastScrollRef.current = -1;

    const draw = () => {
      const scrollTop = scroller.scrollTop;
      if (scrollTop === lastScrollRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastScrollRef.current = scrollTop;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasW, canvasH);

      const firstRow = Math.floor(scrollTop / ROW_H);
      const visibleRows = Math.ceil(canvasH / ROW_H) + 1;
      const offsetY = -(scrollTop % ROW_H);

      for (let vr = 0; vr < visibleRows; vr++) {
        const r = firstRow + vr;
        if (r >= rows) break;
        const y = offsetY + vr * ROW_H;
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= total) break;
          ctx.fillStyle = COLORS[seq[idx]];
          ctx.fillRect(c * COL_W, y, DOT_SIZE, DOT_SIZE);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open, total, seq]);

  if (!open) return null;

  return (
    <div
      ref={wrapRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${formatCount(total)} deaths — one dot per person`}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--s-3) var(--s-4)',
        borderBottom: '1px solid var(--fg-mute)',
        flexShrink: 0,
      }}>
        <span className="t-title fg-alert">{formatCount(total)} DEATHS</span>
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
          [ESC]
        </button>
      </div>

      <p className="t-data fg-mute" style={{ padding: 'var(--s-2) var(--s-4) var(--s-4)', flexShrink: 0 }}>
        EACH DOT = ONE PERSON. SCROLL TO SEE ALL.
      </p>

      {/* Virtual scroll container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
        <div
          ref={scrollRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'scroll',
            overflowX: 'hidden',
          }}
        >
          {/* Spacer — height set dynamically in useEffect */}
          <div style={{ width: 1 }} />
        </div>
      </div>
    </div>
  );
}
