# HMWWCT — How Much Would a War Cost There?

An educational web calculator that estimates the economic and humanitarian cost of a hypothetical military conflict between any two countries, using real data from World Bank, SIPRI, UNHCR, IMF, and FRED.

**Live at:** [hmwwct.vercel.app](https://hmwwct.vercel.app) *(once deployed)*

---

## What it does

Select an aggressor country, a target country, and a conflict scenario (skirmish / conventional / occupation). The calculator returns:

- **Total estimated cost** — military operations, economic disruption, reconstruction
- **Economic impact** — bilateral trade loss, GDP contraction, commodity shocks, sanctions
- **Humanitarian toll** — displaced persons estimate with post-conflict tail
- **Budget reallocation** — what the aggressor would have to cut to fund the war
- **GDP comparison** — cost as a share of both countries' economies
- **Cost per taxpayer** — burden on the aggressor's population

All numbers cite real sources. No black boxes.

---

## Data sources

| Source | Used for |
|--------|----------|
| World Bank API | GDP, population, military spending |
| SIPRI | Military budget fallback data |
| FRED (St. Louis Fed) | Live commodity prices (oil, gas, wheat), CPI |
| IMF | GDP fallback when World Bank returns null |
| UNHCR | Displacement ratios by conflict type |
| Watson Institute | War cost anchors (US Afghanistan/Iraq benchmarks) |
| REST Countries | Country metadata, flags, region |

---

## Methodology

The full methodology is available at `/methodology` in the app. Key formulas:

- **Military cost:** Watson-anchored daily rate × budget scale × distance discount × duration
- **Economic impact:** Trade disruption + GDP contraction + commodity shock + sanctions
- **Humanitarian:** UNHCR displacement ratio × conflict multiplier × per-person cost/year
- **Reconstruction:** Annual rate (1–30% of target GDP) × duration

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The build command is `node node_modules/next/dist/bin/next build` (not `npm run build`) due to a symlink issue on some setups.

### Environment variables

```env
FRED_API_KEY=your_key_here
```

Get a free key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html). The app degrades gracefully without it (commodity prices default to 2023 baselines).

---

## Tech stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Recharts
- @tanstack/react-query
- react-select

---

## Disclaimer

For educational and policy analysis purposes only. All figures are estimates based on historical benchmarks and publicly available data. Not intended to advocate for or against any conflict.
