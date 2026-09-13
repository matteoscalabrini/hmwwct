'use client';

import { useEffect, useRef } from 'react';
import gridData from '@/lib/data/map-grid.json';
import { resolveCellTone } from '@/lib/terminal/mapPaint';

/**
 * 3D particle globe: renders the rasterized country grid (map-grid.json)
 * as points on a rotating sphere. Pure canvas — no 3D dependencies.
 *
 * Interaction contract matches BlockGridMap:
 *   - drag to rotate (inertia + auto-rotation when idle)
 *   - wheel to zoom
 *   - hover a country → onHoverCountry(iso)
 *   - click a country → onClickCountry(iso)
 */

const GRID = gridData as (string | null)[][];
const ROWS = GRID.length;
const COLS = GRID[0].length;
const LAT_MAX = 75;

// ─── Module-level sphere precompute (pure math over static JSON) ────────────

const CELL_COUNT = (() => {
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (GRID[r][c]) n++;
  return n;
})();

/** Unit-sphere coordinates per land cell: [x0, y0, z0, x1, y1, z1, ...] */
const SPHERE = new Float32Array(CELL_COUNT * 3);
/** Index into ISOS per cell. */
const CELL_ISO = new Uint16Array(CELL_COUNT);
const ISOS: string[] = [];
const ISO_INDEX = new Map<string, number>();
/** Cell indices per iso, for highlight passes. */
const CELLS_BY_ISO = new Map<string, number[]>();

(() => {
  const latStep = (2 * LAT_MAX) / ROWS;
  const lonStep = 360 / COLS;
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    const lat = ((LAT_MAX - (r + 0.5) * latStep) * Math.PI) / 180;
    const cl = Math.cos(lat);
    const y = Math.sin(lat);
    for (let c = 0; c < COLS; c++) {
      const iso = GRID[r][c];
      if (!iso) continue;
      const lon = ((-180 + (c + 0.5) * lonStep) * Math.PI) / 180;
      SPHERE[i * 3] = cl * Math.cos(lon);
      SPHERE[i * 3 + 1] = y;
      SPHERE[i * 3 + 2] = cl * Math.sin(lon);

      let isoIdx = ISO_INDEX.get(iso);
      if (isoIdx === undefined) {
        isoIdx = ISOS.length;
        ISOS.push(iso);
        ISO_INDEX.set(iso, isoIdx);
        CELLS_BY_ISO.set(iso, []);
      }
      CELL_ISO[i] = isoIdx;
      CELLS_BY_ISO.get(iso)!.push(i);
      i++;
    }
  }
})();

/** Normalized mean unit vector per iso (centroid on the sphere). */
const CENTROIDS = new Float32Array(ISOS.length * 3);

(() => {
  const acc = new Float32Array(ISOS.length * 3);
  for (let i = 0; i < CELL_COUNT; i++) {
    const isoIdx = CELL_ISO[i];
    acc[isoIdx * 3] += SPHERE[i * 3];
    acc[isoIdx * 3 + 1] += SPHERE[i * 3 + 1];
    acc[isoIdx * 3 + 2] += SPHERE[i * 3 + 2];
  }
  for (let k = 0; k < ISOS.length; k++) {
    const x = acc[k * 3];
    const y = acc[k * 3 + 1];
    const z = acc[k * 3 + 2];
    const len = Math.hypot(x, y, z) || 1;
    CENTROIDS[k * 3] = x / len;
    CENTROIDS[k * 3 + 1] = y / len;
    CENTROIDS[k * 3 + 2] = z / len;
  }
})();

// ─── Per-cell visual style ───────────────────────────────────────────────────

/** Base alpha per tone — grayscale hierarchy on black. */
const TONE_ALPHA: Record<string, number> = {
  ocean: 0,
  neutral: 0.3,
  glow: 0.5,
  'glow-high': 0.75,
  'glow-med': 0.45,
  'glow-low': 0.22,
  aggressor: 1,
  target: 1,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ParticleGlobeProps {
  aggressor: string;
  target: string;
  glowSet?: Set<string>;
  overlay?: Map<string, string>;
  /** cca3 → display name, for the hover label on the canvas. */
  namesByIso?: Record<string, string>;
  onHoverCountry?: (iso: string | null) => void;
  onClickCountry?: (iso: string) => void;
}

const TAU = Math.PI * 2;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.8;
const PITCH_LIMIT = 1.15; // rad (~66°)
const AUTO_ROTATE = 0.0016; // rad/frame — full turn ≈ 65s
const IDLE_RESUME_MS = 4000;
const SPIN_MS = 1100; // spin-to-country animation duration

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Shortest angular delta from a to b, wrapped to [-π, π]. */
const wrapDelta = (a: number, b: number) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

/**
 * Missile-trajectory arc between two unit vectors: slerped ground track
 * lifted off the surface, apex altitude proportional to the distance.
 * Returns points whose radius is >1 at mid-flight (already baked in).
 */
function buildArc(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  samples = 72,
): Float32Array | null {
  let dot = ax * bx + ay * by + az * bz;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 0.01) return null; // same spot
  const sinOmega = Math.sin(omega);
  const apex = 0.14 + 0.3 * (omega / Math.PI); // longer shot → higher arc
  const pts = new Float32Array(samples * 3);
  for (let s = 0; s < samples; s++) {
    const t = s / (samples - 1);
    const wa = Math.sin((1 - t) * omega) / sinOmega;
    const wb = Math.sin(t * omega) / sinOmega;
    const gx = ax * wa + bx * wb;
    const gy = ay * wa + by * wb;
    const gz = az * wa + bz * wb;
    const r = 1 + Math.sin(Math.PI * t) * apex;
    pts[s * 3] = gx * r;
    pts[s * 3 + 1] = gy * r;
    pts[s * 3 + 2] = gz * r;
  }
  return pts;
}

export function ParticleGlobe({
  aggressor,
  target,
  glowSet = new Set(),
  overlay,
  namesByIso,
  onHoverCountry,
  onClickCountry,
}: ParticleGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared render control — lets lightweight effects nudge the loop.
  const ctlRef = useRef({ needsRender: true });

  // Latest-callback refs: parent handlers close over changing state (e.g. the
  // aggressor/target selection flow), so listeners must not capture stale ones.
  const onHoverRef = useRef(onHoverCountry);
  onHoverRef.current = onHoverCountry;
  const onClickRef = useRef(onClickCountry);
  onClickRef.current = onClickCountry;
  const namesRef = useRef<Record<string, string>>(namesByIso ?? {});
  namesRef.current = namesByIso ?? {};

  // Current selection for the draw closure (main effect runs once — props go stale).
  const selectionRef = useRef({ aggressor, target });
  selectionRef.current = { aggressor, target };

  // Pending spin-to-country request, consumed by the render loop.
  const spinRef = useRef<{
    iso: string;
    started: boolean;
    yaw0: number; pitch0: number;
    dyaw: number; dpitch: number;
    start: number;
  } | null>(null);

  // When a country is selected (dropdown or globe click), spin it into view,
  // hold, then let idle auto-rotation resume.
  useEffect(() => {
    if (aggressor) spinRef.current = { iso: aggressor, started: false, yaw0: 0, pitch0: 0, dyaw: 0, dpitch: 0, start: 0 };
  }, [aggressor]);
  useEffect(() => {
    if (target) spinRef.current = { iso: target, started: false, yaw0: 0, pitch0: 0, dyaw: 0, dpitch: 0, start: 0 };
  }, [target]);

  // Per-cell alpha tier, recomputed when selection/overlay changes.
  const styleRef = useRef<Float32Array>(new Float32Array(CELL_COUNT));
  useEffect(() => {
    const styles = styleRef.current;
    const ctx = { aggressor, target, glowSet, overlay };
    for (let i = 0; i < CELL_COUNT; i++) {
      const tone = resolveCellTone(ISOS[CELL_ISO[i]], ctx);
      styles[i] = TONE_ALPHA[tone] ?? 0.3;
    }
    ctlRef.current.needsRender = true;
  }, [aggressor, target, glowSet, overlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const PICK_RADIUS = coarse ? 24 : 12; // px — forgiving taps on phones
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctl = ctlRef.current;
    const styles = styleRef.current;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;

    let yaw = (-80 * Math.PI) / 180; // centers ~10°E (Africa/Europe) on load
    let pitch = 0.42;
    let zoom = coarse ? 1.3 : 1; // phones start zoomed in — taps need bigger countries
    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastY = 0;
    let yawVel = 0;
    let lastInteraction = 0;
    let hoverIso: string | null = null;

    const pointer = { x: -1, y: -1, inside: false };
    let needsPick = false;

    // cached strike-arc geometry, rebuilt when the pair changes
    let arc: Float32Array | null = null;
    let arcKey = '';

    const resize = () => {
      const cssW = container.clientWidth;
      if (cssW === 0) return;
      w = cssW;
      h = cssW; // square globe
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctl.needsRender = true;
    };

    /** Rotate cell i by yaw (Y axis) then pitch (X axis); returns camera-space xyz. */
    const rotate = (x: number, y: number, z: number) => {
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      return {
        x: x1,
        y: y * cp - z1 * sp,
        z: y * sp + z1 * cp,
      };
    };

    const draw = () => {
      const { aggressor, target } = selectionRef.current;
      const cx = w / 2;
      const cyc = h / 2;
      const R = Math.min((w / 2 - 20) * zoom, w / 2 - 6);
      const baseSize = Math.max(1.2, R / 80);
      ctx.clearRect(0, 0, w, h);

      // ghost sphere — rim + faint disc so the globe reads as a body
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cyc, R + 1.5, 0, TAU);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // land cells
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < CELL_COUNT; i++) {
        const p = rotate(SPHERE[i * 3], SPHERE[i * 3 + 1], SPHERE[i * 3 + 2]);
        if (p.z <= 0) continue;
        const depth = 0.35 + 0.65 * p.z;
        const a = styles[i] * depth;
        if (a < 0.015) continue;
        ctx.globalAlpha = a;
        const size = baseSize * (0.7 + 0.5 * p.z);
        ctx.fillRect(cx + R * p.x - size / 2, cyc - R * p.y - size / 2, size, size);
      }

      // hovered country highlight
      if (hoverIso) {
        ctx.fillStyle = '#ffffff';
        const cells = CELLS_BY_ISO.get(hoverIso);
        if (cells) {
          for (const i of cells) {
            const p = rotate(SPHERE[i * 3], SPHERE[i * 3 + 1], SPHERE[i * 3 + 2]);
            if (p.z <= 0) continue;
            ctx.globalAlpha = 0.95 * (0.4 + 0.6 * p.z);
            const size = baseSize * 1.5;
            ctx.fillRect(cx + R * p.x - size / 2, cyc - R * p.y - size / 2, size, size);
          }
        }

        // name tag near the pointer — backed box for legibility over cells
        const name = namesRef.current[hoverIso] ?? hoverIso;
        ctx.globalAlpha = 1;
        ctx.font = '9px "Ioskeley Mono", monospace';
        ctx.textAlign = 'left';
        const tw = ctx.measureText(name).width;
        const padX = 5;
        const tagW = tw + padX * 2;
        const tagH = 9 + 6;
        let lx = pointer.x + 12;
        if (lx + tagW > w - 2) lx = pointer.x - tagW - 12;
        lx = Math.max(2, Math.min(w - tagW - 2, lx));
        const ly = Math.max(tagH + 2, Math.min(h - 4, pointer.y - 12));
        ctx.fillStyle = '#000000';
        ctx.fillRect(lx, ly - tagH, tagW, tagH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx, ly - tagH, tagW, tagH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(name, lx + padX, ly - 4);
      }

      // role rings + labels at country centroids
      ctx.globalAlpha = 1;
      ctx.font = '8px "Ioskeley Mono", monospace';
      ctx.textAlign = 'center';
      const roles: Array<[string, string, boolean]> = [
        [aggressor, 'AGGRESSOR', false],
        [target, 'TARGET', true],
      ];
      for (const [iso, label, dashed] of roles) {
        if (!iso) continue;
        const isoIdx = ISO_INDEX.get(iso);
        if (isoIdx === undefined) continue;
        const p = rotate(CENTROIDS[isoIdx * 3], CENTROIDS[isoIdx * 3 + 1], CENTROIDS[isoIdx * 3 + 2]);
        if (p.z < 0.15) continue; // centroid facing away
        const sx = cx + R * p.x;
        const sy = cyc - R * p.y;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        if (dashed) ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(label, sx, sy - 13);
      }

      // strike arc — missile trajectory from aggressor to target (red accent),
      // drawn last so the trajectory rides above everything
      if (aggressor && target) {
        const key = `${aggressor}>${target}`;
        if (arcKey !== key) {
          const ai = ISO_INDEX.get(aggressor);
          const ti = ISO_INDEX.get(target);
          arc = ai !== undefined && ti !== undefined
            ? buildArc(
                CENTROIDS[ai * 3], CENTROIDS[ai * 3 + 1], CENTROIDS[ai * 3 + 2],
                CENTROIDS[ti * 3], CENTROIDS[ti * 3 + 1], CENTROIDS[ti * 3 + 2],
              )
            : null;
          arcKey = key;
        }
        if (arc) {
          const n = arc.length / 3;
          const phase = reducedMotion ? 0 : (performance.now() * 0.004) % 3; // marching dots
          for (let s = 0; s < n; s++) {
            const p = rotate(arc[s * 3], arc[s * 3 + 1], arc[s * 3 + 2]);
            // lifted points stay visible past the limb — occluded only when
            // behind the sphere AND projecting inside its disc
            if (p.z < 0 && Math.hypot(p.x, p.y) < 1) continue;
            const front = p.z >= 0;
            const depth = front ? 0.65 + 0.35 * Math.min(1, p.z) : 0.35;
            // dash pattern: 2 on, 1 off — offset marches aggressor → target
            const on = (((s - phase) % 3) + 3) % 3 < 2;
            if (!on) continue;
            ctx.globalAlpha = (front ? 1 : 0.2) * depth;
            const size = baseSize * 1.7;
            ctx.fillStyle = '#ff4040';
            ctx.fillRect(cx + R * p.x - size / 2, cyc - R * p.y - size / 2, size, size);
          }
        }
      }
    };

    const pick = (px: number, py: number): string | null => {
      const cx = w / 2;
      const cyc = h / 2;
      const R = Math.min((w / 2 - 20) * zoom, w / 2 - 6);
      let best: string | null = null;
      let bestDistSq = PICK_RADIUS * PICK_RADIUS;
      for (let i = 0; i < CELL_COUNT; i++) {
        const p = rotate(SPHERE[i * 3], SPHERE[i * 3 + 1], SPHERE[i * 3 + 2]);
        if (p.z < 0.05) continue;
        const dx = cx + R * p.x - px;
        const dy = cyc - R * p.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          best = ISOS[CELL_ISO[i]];
        }
      }
      return best;
    };

    const loop = () => {
      if (!running) return;
      if (!document.hidden) {
        // spin-to-country request — recenters the view, then pauses idle rotation
        if (spinRef.current && !dragging) {
          const sp = spinRef.current;
          const isoIdx = ISO_INDEX.get(sp.iso);
          if (!isoIdx) {
            spinRef.current = null;
          } else if (!sp.started) {
            const clat = Math.asin(CENTROIDS[isoIdx * 3 + 1]);
            const clon = Math.atan2(CENTROIDS[isoIdx * 3 + 2], CENTROIDS[isoIdx * 3]);
            // view center is at (pitch, yaw + 90°) — solve for the centroid
            sp.yaw0 = yaw;
            sp.pitch0 = pitch;
            sp.dyaw = wrapDelta(yaw, clon - Math.PI / 2);
            sp.dpitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, clat)) - pitch;
            sp.start = performance.now();
            sp.started = true;
            yawVel = 0;
            if (reducedMotion) {
              yaw += sp.dyaw;
              pitch += sp.dpitch;
              spinRef.current = null;
              lastInteraction = performance.now();
              ctl.needsRender = true;
            }
          } else {
            const t = Math.min((performance.now() - sp.start) / SPIN_MS, 1);
            const e = easeInOutCubic(t);
            yaw = sp.yaw0 + sp.dyaw * e;
            pitch = sp.pitch0 + sp.dpitch * e;
            ctl.needsRender = true;
            if (t >= 1) {
              spinRef.current = null;
              lastInteraction = performance.now(); // hold ~4s before auto-rotation resumes
            }
          }
        }
        if (!reducedMotion && !dragging && !spinRef.current) {
          if (Math.abs(yawVel) > 0.0001) {
            yaw += yawVel;
            yawVel *= 0.94; // inertia decay
            ctl.needsRender = true;
          } else if (performance.now() - lastInteraction > IDLE_RESUME_MS) {
            yaw += AUTO_ROTATE;
            ctl.needsRender = true;
          }
        }
        if (needsPick && !dragging) {
          needsPick = false;
          const iso = pointer.inside ? pick(pointer.x, pointer.y) : null;
          if (iso !== hoverIso) {
            hoverIso = iso;
            onHoverRef.current?.(iso);
            ctl.needsRender = true;
          }
        }
        if (ctl.needsRender) {
          ctl.needsRender = false;
          draw();
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragMoved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      yawVel = 0;
      spinRef.current = null; // manual control cancels any pending spin
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      lastInteraction = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        const k = 0.005 / zoom;
        yaw += dx * k;
        pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + dy * k));
        yawVel = dx * k * 0.4;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        lastInteraction = performance.now();
        ctl.needsRender = true;
      } else {
        needsPick = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = 'grab';
      lastInteraction = performance.now();
      if (dragMoved < 6) {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const iso = pick(px, py);
        if (iso) {
          // tap feedback: treat it as hover too, so the country lights up and
          // the name tag + inspector strip show what was picked (no hover on touch)
          pointer.x = px;
          pointer.y = py;
          pointer.inside = true;
          hoverIso = iso;
          onHoverRef.current?.(iso);
          onClickRef.current?.(iso);
          ctl.needsRender = true;
        }
      }
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      needsPick = true;
      if (hoverIso) {
        hoverIso = null;
        onHoverRef.current?.(null);
        ctl.needsRender = true;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * (1 - e.deltaY * 0.0012)));
      lastInteraction = performance.now();
      ctl.needsRender = true;
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(container);
    resize();

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('visibilitychange', onVisibility);

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Map of the conflict theater as a 3D particle globe. Drag to rotate, click a country to select."
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
