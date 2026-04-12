import { describe, it, expect } from 'vitest';
import { rasterizeGrid } from '../build-map-grid';

const SYNTHETIC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'TST',
      properties: { ISO_A3: 'TST' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]]],
      },
    },
  ],
};

describe('rasterizeGrid', () => {
  it('produces a grid with correct dimensions', () => {
    const grid = rasterizeGrid(SYNTHETIC, { cols: 160, rows: 80, latMax: 75 });
    expect(grid.length).toBe(80);
    expect(grid[0].length).toBe(160);
  });

  it('places TST cells near the origin', () => {
    const grid = rasterizeGrid(SYNTHETIC, { cols: 160, rows: 80, latMax: 75 });
    const r = Math.floor(grid.length / 2);
    const c = Math.floor(grid[0].length / 2);
    expect(grid[r][c]).toBe('TST');
  });

  it('places null in ocean cells', () => {
    const grid = rasterizeGrid(SYNTHETIC, { cols: 160, rows: 80, latMax: 75 });
    expect(grid[0][0]).toBeNull();
  });
});
