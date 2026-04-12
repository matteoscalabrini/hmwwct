'use client';

import { useEffect, useRef, useState } from 'react';
import gridData from '@/lib/data/map-grid.json';
import { resolveCellTone, toneColor } from '@/lib/terminal/mapPaint';

const GRID = gridData as (string | null)[][];
const ROWS = GRID.length;
const COLS = GRID[0]?.length ?? 0;

const CELL = 4;
const GAP = 1;

interface BlockGridMapProps {
  aggressor: string;
  target: string;
  glowSet?: Set<string>;
  onHoverCountry?: (iso: string | null) => void;
}

export function BlockGridMap({ aggressor, target, glowSet = new Set(), onHoverCountry }: BlockGridMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const width = COLS * (CELL + GAP);
  const height = ROWS * (CELL + GAP);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const iso = GRID[r][c];
        const tone = resolveCellTone(iso, { aggressor, target, glowSet });
        ctx.fillStyle = toneColor(tone);
        ctx.fillRect(c * (CELL + GAP), r * (CELL + GAP), CELL, CELL);
      }
    }
  }, [aggressor, target, glowSet, width, height]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (hover) {
      const iso = GRID[hover.r]?.[hover.c];
      if (iso) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (GRID[r][c] === iso) {
              ctx.fillStyle = 'rgba(230, 255, 240, 0.3)';
              ctx.fillRect(c * (CELL + GAP), r * (CELL + GAP), CELL, CELL);
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
    const c = Math.floor(x / (CELL + GAP));
    const r = Math.floor(y / (CELL + GAP));
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
      setHover(null);
      onHoverCountry?.(null);
      return;
    }
    setHover({ r, c });
    onHoverCountry?.(GRID[r][c]);
  };

  const handleLeave = () => {
    setHover(null);
    onHoverCountry?.(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, aspectRatio: `${width} / ${height}` }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Map of conflict theater"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
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
