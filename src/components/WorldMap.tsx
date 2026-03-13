'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { geoNaturalEarth1, geoPath, geoCentroid, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface WorldMapProps {
  aggressorCode: string | null;
  targetCode: string | null;
  onCountryClick: (code: string) => void;
  resultMode?: boolean;
  totalCost?: number;
}

interface CountryFeature extends Feature<Geometry, { name?: string }> {
  id?: string | number;
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  code: string;
}

/* ------------------------------------------------------------------ */
/*  Module-level cache for TopoJSON data                              */
/* ------------------------------------------------------------------ */

let topoCache: Topology | null = null;
let topoFetchPromise: Promise<Topology> | null = null;

async function fetchTopoJSON(): Promise<Topology> {
  if (topoCache) return topoCache;
  if (topoFetchPromise) return topoFetchPromise;
  topoFetchPromise = fetch(
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  )
    .then((r) => {
      if (!r.ok) throw new Error(`TopoJSON fetch failed: ${r.status}`);
      return r.json() as Promise<Topology>;
    })
    .then((topo) => {
      topoCache = topo;
      return topo;
    });
  return topoFetchPromise;
}

/* ------------------------------------------------------------------ */
/*  UN M49 numeric ID  →  ISO 3166-1 alpha-3 lookup                   */
/*  Keys are strings because TopoJSON IDs arrive as strings.          */
/* ------------------------------------------------------------------ */

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

/* Reverse mapping for convenience */
const alpha3ToName: Record<string, string> = {
  AFG: 'Afghanistan', ALB: 'Albania', DZA: 'Algeria', AND: 'Andorra',
  AGO: 'Angola', ATG: 'Antigua & Barbuda', ARG: 'Argentina', AUS: 'Australia',
  AUT: 'Austria', AZE: 'Azerbaijan', BHS: 'Bahamas', BHR: 'Bahrain',
  BGD: 'Bangladesh', BRB: 'Barbados', BLR: 'Belarus', BEL: 'Belgium',
  BLZ: 'Belize', BEN: 'Benin', BTN: 'Bhutan', BOL: 'Bolivia',
  BIH: 'Bosnia & Herzegovina', BWA: 'Botswana', BRA: 'Brazil', BRN: 'Brunei',
  BGR: 'Bulgaria', BFA: 'Burkina Faso', BDI: 'Burundi', CPV: 'Cabo Verde',
  KHM: 'Cambodia', CMR: 'Cameroon', CAN: 'Canada', CAF: 'Central African Rep.',
  TCD: 'Chad', CHL: 'Chile', CHN: 'China', COL: 'Colombia', COM: 'Comoros',
  COG: 'Congo', COD: 'DR Congo', CRI: 'Costa Rica', CIV: "Cote d'Ivoire",
  HRV: 'Croatia', CUB: 'Cuba', CYP: 'Cyprus', CZE: 'Czechia',
  DNK: 'Denmark', DJI: 'Djibouti', DMA: 'Dominica', DOM: 'Dominican Rep.',
  ECU: 'Ecuador', EGY: 'Egypt', SLV: 'El Salvador', GNQ: 'Equatorial Guinea',
  ERI: 'Eritrea', EST: 'Estonia', SWZ: 'Eswatini', ETH: 'Ethiopia',
  FJI: 'Fiji', FIN: 'Finland', FRA: 'France', GAB: 'Gabon', GMB: 'Gambia',
  GEO: 'Georgia', DEU: 'Germany', GHA: 'Ghana', GRC: 'Greece',
  GRD: 'Grenada', GTM: 'Guatemala', GIN: 'Guinea', GNB: 'Guinea-Bissau',
  GUY: 'Guyana', HTI: 'Haiti', HND: 'Honduras', HUN: 'Hungary',
  ISL: 'Iceland', IND: 'India', IDN: 'Indonesia', IRN: 'Iran', IRQ: 'Iraq',
  IRL: 'Ireland', ISR: 'Israel', ITA: 'Italy', JAM: 'Jamaica', JPN: 'Japan',
  JOR: 'Jordan', KAZ: 'Kazakhstan', KEN: 'Kenya', KIR: 'Kiribati',
  PRK: 'North Korea', KOR: 'South Korea', XKX: 'Kosovo', KWT: 'Kuwait',
  KGZ: 'Kyrgyzstan', LAO: 'Laos', LVA: 'Latvia', LBN: 'Lebanon',
  LSO: 'Lesotho', LBR: 'Liberia', LBY: 'Libya', LIE: 'Liechtenstein',
  LTU: 'Lithuania', LUX: 'Luxembourg', MDG: 'Madagascar', MWI: 'Malawi',
  MYS: 'Malaysia', MDV: 'Maldives', MLI: 'Mali', MLT: 'Malta',
  MHL: 'Marshall Islands', MRT: 'Mauritania', MUS: 'Mauritius', MEX: 'Mexico',
  FSM: 'Micronesia', MDA: 'Moldova', MCO: 'Monaco', MNG: 'Mongolia',
  MNE: 'Montenegro', MAR: 'Morocco', MOZ: 'Mozambique', MMR: 'Myanmar',
  NAM: 'Namibia', NRU: 'Nauru', NPL: 'Nepal', NLD: 'Netherlands',
  NZL: 'New Zealand', NIC: 'Nicaragua', NER: 'Niger', NGA: 'Nigeria',
  MKD: 'North Macedonia', NOR: 'Norway', OMN: 'Oman', PAK: 'Pakistan',
  PLW: 'Palau', PAN: 'Panama', PNG: 'Papua New Guinea', PRY: 'Paraguay',
  PER: 'Peru', PHL: 'Philippines', POL: 'Poland', PRT: 'Portugal',
  QAT: 'Qatar', ROU: 'Romania', RUS: 'Russia', RWA: 'Rwanda',
  KNA: 'St. Kitts & Nevis', LCA: 'St. Lucia', VCT: 'St. Vincent',
  WSM: 'Samoa', SMR: 'San Marino', STP: 'Sao Tome & Principe',
  SAU: 'Saudi Arabia', SEN: 'Senegal', SRB: 'Serbia', SYC: 'Seychelles',
  SLE: 'Sierra Leone', SGP: 'Singapore', SVK: 'Slovakia', SVN: 'Slovenia',
  SLB: 'Solomon Islands', SOM: 'Somalia', ZAF: 'South Africa',
  SSD: 'South Sudan', ESP: 'Spain', LKA: 'Sri Lanka', SDN: 'Sudan',
  SUR: 'Suriname', SWE: 'Sweden', CHE: 'Switzerland', SYR: 'Syria',
  TWN: 'Taiwan', TJK: 'Tajikistan', TZA: 'Tanzania', THA: 'Thailand',
  TLS: 'Timor-Leste', TGO: 'Togo', TON: 'Tonga', TTO: 'Trinidad & Tobago',
  TUN: 'Tunisia', TUR: 'Turkey', TKM: 'Turkmenistan', TUV: 'Tuvalu',
  UGA: 'Uganda', UKR: 'Ukraine', ARE: 'UAE', GBR: 'United Kingdom',
  USA: 'United States', URY: 'Uruguay', UZB: 'Uzbekistan', VUT: 'Vanuatu',
  VEN: 'Venezuela', VNM: 'Vietnam', YEM: 'Yemen', ZMB: 'Zambia',
  ZWE: 'Zimbabwe', PSE: 'Palestine', ESH: 'Western Sahara',
  GRL: 'Greenland', NCL: 'New Caledonia', PRI: 'Puerto Rico',
};

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function formatCost(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const WorldMap: React.FC<WorldMapProps> = ({
  aggressorCode,
  targetCode,
  onCountryClick,
  resultMode = false,
  totalCost,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  /* ---------- projection & path generator ---------- */
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(160)
        .translate([480, 260]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  /* ---------- load TopoJSON on mount ---------- */
  useEffect(() => {
    let cancelled = false;
    fetchTopoJSON().then((topo) => {
      if (cancelled) return;
      const countries = topo.objects['countries'] as GeometryCollection;
      const fc = feature(topo, countries) as FeatureCollection;
      setFeatures(fc.features as CountryFeature[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- code lookup helper ---------- */
  const codeForFeature = useCallback((f: CountryFeature): string | null => {
    const id = String(f.id ?? '').padStart(3, '0');
    return numericToAlpha3[id] ?? null;
  }, []);

  const nameForCode = useCallback((code: string): string => {
    return alpha3ToName[code] ?? code;
  }, []);

  /* ---------- centroids for arc ---------- */
  const centroidOf = useCallback(
    (code: string): [number, number] | null => {
      const feat = features.find((f) => codeForFeature(f) === code);
      if (!feat) return null;
      return geoCentroid(feat);
    },
    [features, codeForFeature]
  );

  /* ---------- arc path ---------- */
  const arcPath = useMemo(() => {
    if (!aggressorCode || !targetCode) return null;
    const c1 = centroidOf(aggressorCode);
    const c2 = centroidOf(targetCode);
    if (!c1 || !c2) return null;

    const interpolator = geoInterpolate(c1, c2);
    const points: [number, number][] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const geo = interpolator(t);
      const px = projection(geo);
      if (px) points.push(px);
    }
    if (points.length < 2) return null;

    return (
      'M' +
      points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')
    );
  }, [aggressorCode, targetCode, centroidOf, projection]);

  /* ---------- arc midpoint for cost label ---------- */
  const arcMidpoint = useMemo((): [number, number] | null => {
    if (!aggressorCode || !targetCode) return null;
    const c1 = centroidOf(aggressorCode);
    const c2 = centroidOf(targetCode);
    if (!c1 || !c2) return null;
    const mid = geoInterpolate(c1, c2)(0.5);
    return projection(mid) as [number, number] | null;
  }, [aggressorCode, targetCode, centroidOf, projection]);

  /* ---------- fill for a country ---------- */
  const fillForCode = useCallback(
    (code: string | null): string => {
      if (!code) return '#12211b';
      if (code === aggressorCode) return '#8ea7ff';
      if (code === targetCode) return '#ff765b';
      if (code === hoveredCode) return '#1f3b30';
      return '#12211b';
    },
    [aggressorCode, targetCode, hoveredCode]
  );

  /* ---------- opacity in result mode ---------- */
  const opacityForCode = useCallback(
    (code: string | null): number => {
      if (!resultMode) return 1;
      if (code === aggressorCode || code === targetCode) return 1;
      return 0.3;
    },
    [resultMode, aggressorCode, targetCode]
  );

  /* ---------- filter ref for glow ---------- */
  const filterForCode = useCallback(
    (code: string | null): string | undefined => {
      if (code === aggressorCode || code === targetCode) return 'url(#glow)';
      return undefined;
    },
    [aggressorCode, targetCode]
  );

  /* ---------- mouse handlers ---------- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, code: string) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name: nameForCode(code),
        code,
      });
      setHoveredCode(code);
    },
    [nameForCode]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredCode(null);
  }, []);

  const handleClick = useCallback(
    (code: string) => {
      onCountryClick(code);
    },
    [onCountryClick]
  );

  /* ---------- render ---------- */
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      style={{ background: 'var(--bg)' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 960 500"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Glow filter for selected countries */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for the connection arc */}
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8ea7ff" stopOpacity={0.9} />
            <stop offset="50%" stopColor="#54f5d6" stopOpacity={1} />
            <stop offset="100%" stopColor="#ff765b" stopOpacity={0.9} />
          </linearGradient>
        </defs>

        <rect width="960" height="500" fill="#07100d" />

        <g>
          {features.map((feat, i) => {
            const code = codeForFeature(feat);
            const d = pathGen(feat) ?? undefined;
            return (
              <path
                key={code ?? `unk-${i}`}
                d={d}
                fill={fillForCode(code)}
                stroke="#27473b"
                strokeWidth={0.6}
                opacity={opacityForCode(code)}
                filter={filterForCode(code)}
                cursor={code ? 'pointer' : 'default'}
                onMouseMove={code ? (e) => handleMouseMove(e, code) : undefined}
                onMouseLeave={handleMouseLeave}
                onClick={code ? () => handleClick(code) : undefined}
                style={{
                  transition: 'fill 0.2s ease, opacity 0.3s ease, stroke 0.2s ease',
                }}
              />
            );
          })}
        </g>

        {arcPath && (
          <g>
            <path
              d={arcPath}
              fill="none"
              stroke="#54f5d6"
              strokeWidth={4}
              strokeOpacity={0.18}
              strokeLinecap="round"
            />
            <path
              d={arcPath}
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-18"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        )}

        {resultMode && totalCost != null && arcMidpoint && (
          <g>
            <rect
              x={arcMidpoint[0] - 60}
              y={arcMidpoint[1] - 28}
              width={120}
              height={28}
              rx={6}
              fill="rgba(7, 16, 13, 0.88)"
              stroke="#54f5d6"
              strokeWidth={0.8}
            />
            <text
              x={arcMidpoint[0]}
              y={arcMidpoint[1] - 10}
              textAnchor="middle"
              fill="#54f5d6"
              fontSize={14}
              fontWeight={600}
              fontFamily="'JetBrains Mono', monospace"
            >
              {formatCost(totalCost)}
            </text>
          </g>
        )}

        {aggressorCode && (() => {
          const c = centroidOf(aggressorCode);
          if (!c) return null;
          const p = projection(c);
          if (!p) return null;
          return (
            <text
              x={p[0]}
              y={p[1] - 12}
              textAnchor="middle"
              fill="#cfd7ff"
              fontSize={9}
              fontWeight={600}
              fontFamily="'JetBrains Mono', monospace"
              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              AGGRESSOR
            </text>
          );
        })()}
        {targetCode && (() => {
          const c = centroidOf(targetCode);
          if (!c) return null;
          const p = projection(c);
          if (!p) return null;
          return (
            <text
              x={p[0]}
              y={p[1] - 12}
              textAnchor="middle"
              fill="#ffc1b3"
              fontSize={9}
              fontWeight={600}
              fontFamily="'JetBrains Mono', monospace"
              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              TARGET
            </text>
          );
        })()}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 36,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            style={{
              background: 'rgba(12, 21, 18, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(45, 93, 73, 0.75)',
              borderRadius: 6,
              padding: '6px 10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                color: '#effaf4',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              {tooltip.name}
            </span>
            <span
              style={{
                color: '#73917f',
                fontSize: 10,
                marginLeft: 6,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {tooltip.code}
            </span>
            {tooltip.code === aggressorCode && (
              <span
                style={{
                  color: '#8ea7ff',
                  fontSize: 10,
                  marginLeft: 8,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Aggressor
              </span>
            )}
            {tooltip.code === targetCode && (
              <span
                style={{
                  color: '#ff765b',
                  fontSize: 10,
                  marginLeft: 8,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Target
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
