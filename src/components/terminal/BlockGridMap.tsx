'use client';

import { useEffect, useRef, useState } from 'react';
import gridData from '@/lib/data/map-grid.json';
import { resolveCellTone, toneColor } from '@/lib/terminal/mapPaint';

const GRID = gridData as (string | null)[][];

const CELL = 2;
const GAP = 1;
const STEP = CELL + GAP;

const ACTIVE_BOUNDS = getActiveBounds(GRID);
const ACTIVE_ROWS = ACTIVE_BOUNDS.maxRow - ACTIVE_BOUNDS.minRow + 1;
const ACTIVE_COLS = ACTIVE_BOUNDS.maxCol - ACTIVE_BOUNDS.minCol + 1;

interface BlockGridMapProps {
  aggressor: string;
  target: string;
  glowSet?: Set<string>;
  overlay?: Map<string, string>;
  onHoverCountry?: (iso: string | null) => void;
  onClickCountry?: (iso: string) => void;
}

export function BlockGridMap({ aggressor, target, glowSet = new Set(), overlay, onHoverCountry, onClickCountry }: BlockGridMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const width = ACTIVE_COLS * STEP;
  const height = ACTIVE_ROWS * STEP;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    for (let r = ACTIVE_BOUNDS.minRow; r <= ACTIVE_BOUNDS.maxRow; r++) {
      for (let c = ACTIVE_BOUNDS.minCol; c <= ACTIVE_BOUNDS.maxCol; c++) {
        const iso = GRID[r][c];
        const tone = resolveCellTone(iso, { aggressor, target, glowSet, overlay });
        ctx.fillStyle = toneColor(tone);
        ctx.fillRect((c - ACTIVE_BOUNDS.minCol) * STEP, (r - ACTIVE_BOUNDS.minRow) * STEP, CELL, CELL);
      }
    }
  }, [aggressor, target, glowSet, overlay, width, height]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (hover) {
      const iso = GRID[hover.r]?.[hover.c];
      if (iso) {
        for (let r = ACTIVE_BOUNDS.minRow; r <= ACTIVE_BOUNDS.maxRow; r++) {
          for (let c = ACTIVE_BOUNDS.minCol; c <= ACTIVE_BOUNDS.maxCol; c++) {
            if (GRID[r][c] === iso) {
              ctx.fillStyle = 'rgba(230, 255, 240, 0.3)';
              ctx.fillRect((c - ACTIVE_BOUNDS.minCol) * STEP, (r - ACTIVE_BOUNDS.minRow) * STEP, CELL, CELL);
            }
          }
        }
      }
    }
  }, [hover, width, height]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const c = ACTIVE_BOUNDS.minCol + Math.floor(x / STEP);
    const r = ACTIVE_BOUNDS.minRow + Math.floor(y / STEP);
    if (r < ACTIVE_BOUNDS.minRow || r > ACTIVE_BOUNDS.maxRow || c < ACTIVE_BOUNDS.minCol || c > ACTIVE_BOUNDS.maxCol) {
      setHover(null);
      onHoverCountry?.(null);
      return;
    }
    setHover({ r, c });
    onHoverCountry?.(GRID[r][c]);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClickCountry) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const c = ACTIVE_BOUNDS.minCol + Math.floor(x / STEP);
    const r = ACTIVE_BOUNDS.minRow + Math.floor(y / STEP);
    if (r >= ACTIVE_BOUNDS.minRow && r <= ACTIVE_BOUNDS.maxRow && c >= ACTIVE_BOUNDS.minCol && c <= ACTIVE_BOUNDS.maxCol) {
      const iso = GRID[r][c];
      if (iso) onClickCountry(iso);
    }
  };

  const handleLeave = () => {
    setHover(null);
    onHoverCountry?.(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${width} / ${height}`, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Map of conflict theater"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }}
      />
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none' }}
      />
    </div>
  );
}

function getActiveBounds(grid: (string | null)[][]) {
  let minRow = grid.length;
  let maxRow = -1;
  let minCol = grid[0]?.length ?? 0;
  let maxCol = -1;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (!grid[r][c]) continue;
      minRow = Math.min(minRow, r);
      maxRow = Math.max(maxRow, r);
      minCol = Math.min(minCol, c);
      maxCol = Math.max(maxCol, c);
    }
  }

  if (maxRow === -1 || maxCol === -1) {
    return {
      minRow: 0,
      maxRow: Math.max(grid.length - 1, 0),
      minCol: 0,
      maxCol: Math.max((grid[0]?.length ?? 1) - 1, 0),
    };
  }

  return { minRow, maxRow, minCol, maxCol };
}
