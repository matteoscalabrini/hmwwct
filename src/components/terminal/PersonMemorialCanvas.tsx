'use client';

import { useEffect, useRef } from 'react';
import { buildSequence } from '@/lib/terminal/demographic-sequence';
import { createSpriteSheet } from '@/lib/terminal/sprite-factory';

interface Props {
  total: number;
  childRatio: number;
  casualtyRatio: number;
  height: number;
}

const CELL = 4;
const GAP = 1;
const ROW_H = 5 + GAP;
const COL_W = CELL + GAP;

export function PersonMemorialCanvas({
  total,
  childRatio,
  casualtyRatio,
  height,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const width = wrap.clientWidth;
    const cols = Math.floor(width / COL_W);
    if (cols <= 0) return;

    const rows = Math.ceil(total / cols);
    const totalH = rows * ROW_H;
    canvas.width = width;
    canvas.height = totalH;
    canvas.style.width = width + 'px';
    canvas.style.height = totalH + 'px';

    // OffscreenCanvas is not available in SSR / jsdom — guard gracefully
    if (typeof OffscreenCanvas === 'undefined') return;

    const sheet = createSpriteSheet({
      adult: getCss('--phosphor'),
      child: getCss('--fg-dim'),
      casualty: getCss('--alert'),
    });
    const seq = buildSequence(total, childRatio, casualtyRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    const draw = () => {
      const scrollTop = wrap.scrollTop;
      const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - 2);
      const lastRow = Math.min(
        rows,
        Math.ceil((scrollTop + height) / ROW_H) + 2
      );
      ctx.clearRect(0, firstRow * ROW_H, width, (lastRow - firstRow) * ROW_H);
      for (let r = firstRow; r < lastRow; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (i >= total) break;
          const variant = seq[i];
          ctx.drawImage(
            sheet,
            variant * CELL,
            0,
            CELL,
            5,
            c * COL_W,
            r * ROW_H,
            CELL,
            5
          );
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    draw();
    wrap.addEventListener('scroll', onScroll);
    return () => {
      wrap.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [total, childRatio, casualtyRatio, height]);

  return (
    <div ref={wrapRef} style={{ height, overflow: 'auto' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function getCss(name: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    '#4aff7a'
  );
}
