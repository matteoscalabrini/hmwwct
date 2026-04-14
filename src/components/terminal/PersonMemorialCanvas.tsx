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
const TILE_ROWS = 10;

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

    // Cap DPR at 2 — at 4×5 sprite size higher DPR buys nothing
    const dpr = Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, 2);
    canvas.width = width * dpr;
    canvas.height = totalH * dpr;
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
    ctx.scale(dpr, dpr);

    // Build tile cache: pre-render strips of TILE_ROWS rows into OffscreenCanvases
    const tileCount = Math.ceil(rows / TILE_ROWS);
    const tiles: OffscreenCanvas[] = [];
    for (let t = 0; t < tileCount; t++) {
      const rowsInTile = Math.min(TILE_ROWS, rows - t * TILE_ROWS);
      const tileH = rowsInTile * ROW_H;
      const tile = new OffscreenCanvas(width, tileH);
      const tCtx = tile.getContext('2d')!;
      tCtx.imageSmoothingEnabled = false;
      for (let lr = 0; lr < rowsInTile; lr++) {
        const r = t * TILE_ROWS + lr;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (i >= total) break;
          const variant = seq[i];
          tCtx.drawImage(sheet, variant * CELL, 0, CELL, 5, c * COL_W, lr * ROW_H, CELL, 5);
        }
      }
      tiles.push(tile);
    }

    let raf = 0;
    let lastScrollTop = -1;

    const draw = () => {
      const scrollTop = wrap.scrollTop;
      // rAF coalescing: skip draw if scrollTop hasn't changed
      if (scrollTop === lastScrollTop) return;
      lastScrollTop = scrollTop;

      const firstTile = Math.max(0, Math.floor(scrollTop / (TILE_ROWS * ROW_H)) - 1);
      const lastTile = Math.min(tileCount, Math.ceil((scrollTop + height) / (TILE_ROWS * ROW_H)) + 1);
      ctx.clearRect(0, firstTile * TILE_ROWS * ROW_H, width, (lastTile - firstTile) * TILE_ROWS * ROW_H);
      for (let t = firstTile; t < lastTile; t++) {
        ctx.drawImage(tiles[t], 0, t * TILE_ROWS * ROW_H);
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
