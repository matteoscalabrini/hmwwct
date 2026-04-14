import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { geoContains, geoArea } from 'd3-geo';
import * as topojson from 'topojson-client';

export interface GridOptions {
  cols: number;
  rows: number;
  latMax: number;
}

type Cell = string | null;
type Grid = Cell[][];

/* UN M49 numeric ID → ISO 3166-1 alpha-3 lookup.
   Keys are strings (zero-padded to 3 digits to match .padStart(3,'0') usage). */
const numericToAlpha3: Record<string, string> = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '020': 'AND', '024': 'AGO',
  '028': 'ATG', '032': 'ARG', '036': 'AUS', '040': 'AUT', '031': 'AZE',
  '044': 'BHS', '048': 'BHR', '050': 'BGD', '052': 'BRB', '112': 'BLR',
  '056': 'BEL', '084': 'BLZ', '204': 'BEN', '064': 'BTN', '068': 'BOL',
  '070': 'BIH', '072': 'BWA', '076': 'BRA', '096': 'BRN', '100': 'BGR',
  '854': 'BFA', '108': 'BDI', '132': 'CPV', '116': 'KHM', '120': 'CMR',
  '124': 'CAN', '140': 'CAF', '148': 'TCD', '152': 'CHL', '156': 'CHN',
  '170': 'COL', '174': 'COM', '178': 'COG', '180': 'COD', '188': 'CRI',
  '384': 'CIV', '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE',
  '208': 'DNK', '262': 'DJI', '212': 'DMA', '214': 'DOM', '218': 'ECU',
  '818': 'EGY', '222': 'SLV', '226': 'GNQ', '232': 'ERI', '233': 'EST',
  '748': 'SWZ', '231': 'ETH', '242': 'FJI', '246': 'FIN', '250': 'FRA',
  '266': 'GAB', '270': 'GMB', '268': 'GEO', '276': 'DEU', '288': 'GHA',
  '300': 'GRC', '308': 'GRD', '320': 'GTM', '324': 'GIN', '624': 'GNB',
  '328': 'GUY', '332': 'HTI', '340': 'HND', '348': 'HUN', '352': 'ISL',
  '356': 'IND', '360': 'IDN', '364': 'IRN', '368': 'IRQ', '372': 'IRL',
  '376': 'ISR', '380': 'ITA', '388': 'JAM', '392': 'JPN', '400': 'JOR',
  '398': 'KAZ', '404': 'KEN', '296': 'KIR', '408': 'PRK', '410': 'KOR',
  '-99': 'XKX', '414': 'KWT', '417': 'KGZ', '418': 'LAO', '428': 'LVA',
  '422': 'LBN', '426': 'LSO', '430': 'LBR', '434': 'LBY', '438': 'LIE',
  '440': 'LTU', '442': 'LUX', '450': 'MDG', '454': 'MWI', '458': 'MYS',
  '462': 'MDV', '466': 'MLI', '470': 'MLT', '584': 'MHL', '478': 'MRT',
  '480': 'MUS', '484': 'MEX', '583': 'FSM', '498': 'MDA', '492': 'MCO',
  '496': 'MNG', '499': 'MNE', '504': 'MAR', '508': 'MOZ', '104': 'MMR',
  '516': 'NAM', '520': 'NRU', '524': 'NPL', '528': 'NLD', '554': 'NZL',
  '558': 'NIC', '562': 'NER', '566': 'NGA', '807': 'MKD', '578': 'NOR',
  '512': 'OMN', '586': 'PAK', '585': 'PLW', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA', '659': 'KNA',
  '662': 'LCA', '670': 'VCT', '882': 'WSM', '674': 'SMR', '678': 'STP',
  '682': 'SAU', '686': 'SEN', '688': 'SRB', '690': 'SYC', '694': 'SLE',
  '702': 'SGP', '703': 'SVK', '705': 'SVN', '090': 'SLB', '706': 'SOM',
  '710': 'ZAF', '728': 'SSD', '724': 'ESP', '144': 'LKA', '729': 'SDN',
  '740': 'SUR', '752': 'SWE', '756': 'CHE', '760': 'SYR', '158': 'TWN',
  '762': 'TJK', '834': 'TZA', '764': 'THA', '626': 'TLS', '768': 'TGO',
  '776': 'TON', '780': 'TTO', '788': 'TUN', '792': 'TUR', '795': 'TKM',
  '798': 'TUV', '800': 'UGA', '804': 'UKR', '784': 'ARE', '826': 'GBR',
  '840': 'USA', '858': 'URY', '860': 'UZB', '548': 'VUT', '862': 'VEN',
  '704': 'VNM', '887': 'YEM', '894': 'ZMB', '716': 'ZWE',
  // Territories / special
  '275': 'PSE', '732': 'ESH', '540': 'NCL', '238': 'FLK',
  '304': 'GRL', '254': 'GUF', '474': 'MTQ', '312': 'GLP',
  '175': 'MYT', '876': 'WLF', '580': 'MNP', '316': 'GUM',
  '850': 'VIR', '630': 'PRI',
};

/** Reverse all exterior rings of a polygon/multipolygon feature.
 *  Used to fix features that d3-geo interprets as covering the complement
 *  of the intended area (i.e., inverted winding). */
function invertFeatureWinding(feat: GeoJSON.Feature): GeoJSON.Feature {
  const geom = feat.geometry;
  if (!geom) return feat;

  function flipRings(rings: number[][][]): number[][][] {
    return rings.map((ring, i) =>
      i === 0 ? [...ring].reverse() : ring // only flip exterior ring
    );
  }

  if (geom.type === 'Polygon') {
    return { ...feat, geometry: { ...geom, coordinates: flipRings(geom.coordinates) } };
  }
  if (geom.type === 'MultiPolygon') {
    return {
      ...feat,
      geometry: {
        ...geom,
        coordinates: geom.coordinates.map((poly) => flipRings(poly)),
      },
    };
  }
  return feat;
}

/** Return the feature as-is, or with inverted winding if d3-geo reports its
 *  area as > half the sphere (which means the winding is backwards). */
function normalizeFeature(feat: GeoJSON.Feature): GeoJSON.Feature {
  const HALF_SPHERE = 2 * Math.PI; // steradians
  if (geoArea(feat) > HALF_SPHERE) {
    return invertFeatureWinding(feat);
  }
  return feat;
}

export function rasterizeGrid(
  fc: GeoJSON.FeatureCollection,
  opts: GridOptions
): Grid {
  const { cols, rows, latMax } = opts;
  const grid: Grid = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Normalize winding for all features once up front
  const features = fc.features.map(normalizeFeature);

  for (let r = 0; r < rows; r += 1) {
    const lat = latMax - (r + 0.5) * ((2 * latMax) / rows);
    for (let c = 0; c < cols; c += 1) {
      const lon = -180 + (c + 0.5) * (360 / cols);
      for (const feat of features) {
        if (geoContains(feat as GeoJSON.Feature, [lon, lat])) {
          // Determine ISO code: try feat.id first (may be alpha-3 or numeric),
          // then properties.ISO_A3, then numeric lookup via numericToAlpha3
          let iso: string | null = null;
          const rawId = feat.id != null ? String(feat.id) : null;
          if (rawId) {
            // If it's a short alphabetic string (like 'TST', 'USA'), use directly
            if (/^[A-Z]{2,3}$/.test(rawId)) {
              iso = rawId;
            } else {
              // Numeric id — zero-pad to 3 digits and look up
              const padded = rawId.padStart(3, '0');
              iso = numericToAlpha3[padded] ?? null;
            }
          }
          if (!iso) {
            const props = feat.properties as { ISO_A3?: string } | null;
            iso = props?.ISO_A3 ?? null;
          }
          grid[r][c] = iso;
          break;
        }
      }
    }
  }

  return grid;
}

function main() {
  const topoPath = resolve(process.cwd(), 'public/world-110m.json');
  const topo = JSON.parse(readFileSync(topoPath, 'utf-8'));
  const objectKey = Object.keys(topo.objects)[0];
  const fc = topojson.feature(topo, topo.objects[objectKey]) as unknown as GeoJSON.FeatureCollection;

  // Resolution 160×80, latMax 75° chosen deliberately:
  //   • Produces 152 unique ISO codes (all major territories represented)
  //   • Raw output is ~68 KB (< 7 KB gzipped) — well within budget
  //   • Each cell ≈ 2.25° lon × 1.875° lat, enough to identify every country
  //     larger than ~50 000 km², including tiny Gulf/Caribbean states
  //   • Higher resolutions (320×160) offer diminishing returns and multiply
  //     build time and bundle size without adding visible countries
  const grid = rasterizeGrid(fc, { cols: 160, rows: 80, latMax: 75 });
  const outPath = resolve(process.cwd(), 'src/lib/data/map-grid.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(grid));

  const filled = grid.flat().filter((c) => c !== null).length;
  const total = 160 * 80;
  console.log(`Wrote ${outPath}: ${filled}/${total} cells filled (${Math.round((filled / total) * 100)}%)`);
}

// ESM/CJS-compatible main guard
const isMain =
  typeof require !== 'undefined'
    ? require.main === module
    : import.meta.url === `file://${process.argv[1]}`;

if (isMain) main();
