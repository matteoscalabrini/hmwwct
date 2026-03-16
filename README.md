# HMWWCT — How Much Would a War Cost There?

An educational web calculator that estimates the economic and humanitarian cost of a hypothetical military conflict between any two countries, using real data from World Bank, SIPRI, UNHCR, IMF, FRED, UN Comtrade, and ACLED.

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
| [World Bank API](https://data.worldbank.org/) | GDP, population, military spending |
| [SIPRI](https://www.sipri.org/databases/milex) | Military budget fallback data |
| [FRED (St. Louis Fed)](https://fred.stlouisfed.org/) | Live commodity prices (oil, gas, wheat), CPI |
| [IMF](https://www.imf.org/) | GDP fallback when World Bank returns null |
| [UNHCR](https://www.unhcr.org/) | Displacement ratios by conflict type |
| [UN Comtrade API](https://comtradeplus.un.org/) | Optional live bilateral trade replacement |
| [ACLED](https://acleddata.com/) | Optional live political-violence overlay |
| [Watson Institute](https://watson.brown.edu/costsofwar/) | War cost anchors (US Afghanistan/Iraq benchmarks) |
| [REST Countries](https://restcountries.com/) | Country metadata, flags, region |

---

## Methodology

The full methodology is available at `/methodology` in the app. Key formulas:

- **Military cost:** Watson-anchored daily rate × budget scale × distance discount × duration
- **Economic impact:** Trade disruption + GDP contraction + commodity shock + sanctions
- **Humanitarian:** UNHCR displacement ratio × conflict multiplier × per-person cost/year
- **Reconstruction:** Annual rate (1–30% of target GDP) × duration

### Cost Categories Explained

#### 1. Military Cost
Based on Watson Institute case studies (Afghanistan, Iraq, Kosovo), scaled by:
- Aggressor's military budget vs US reference ($700B)
- Scenario intensity (precision strike < skirmish < conventional < occupation)
- Distance discount (logistics overhead for远距离 conflicts)
- Attrition (equipment losses)

#### 2. Economic Impact
Includes:
- **Trade disruption:** Bilateral trade volume reduction during conflict
- **GDP contraction:** Target country economic output loss
- **Capital flight:** Accelerated capital outflow during instability
- **Sanctions drag:** Aggressor economic impact from war-related sanctions
- **Commodity shocks:** Global price impacts for oil, gas, wheat producers

#### 3. Humanitarian Cost
Estimates displacement (not casualties) using:
- UNHCR displacement ratios by conflict type
- Population at risk (dampened for large countries in skirmishes)
- Post-conflict tail (displacement outlasts conflict by 1.5-2 years)
- Per-person cost: UNHCR + WHO medical support

#### 4. Reconstruction
Sublinear scaling relative to GDP (richer countries don't proportionally more):
- Infrastructure repair (roads, power, water)
- Housing reconstruction
- Public services (healthcare, education)
- Economic recovery support

---

## Running locally

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/hmwwct.git
cd hmwwct

# Install dependencies
npm install
```

### Environment Variables (Optional)

Create a `.env.local` file in the project root:

```env
# FRED API Key (for live commodity prices and CPI)
FRED_API_KEY=your_fred_api_key_here

# UN Comtrade API Key (for live bilateral trade data)
COMTRADE_SUBSCRIPTION_KEY=your_comtrade_subscription_key_here

# ACLED API Credentials (for live political violence data)
ACLED_EMAIL=your_acled_email_here
ACLED_PASSWORD=your_acled_password_here
```

**Note:** All environment variables are optional. The app works with static fallback data when APIs are unavailable.

Get a free FRED API key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html).

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The build command is `node node_modules/next/dist/bin/next build` (not `npm run build`) due to a symlink issue on some setups.

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── calculate/        # Main war cost calculation endpoint
│   │   ├── countries/        # Country list endpoint
│   │   ├── opportunity-context/  # Opportunity context data
│   │   └── world-bank/       # World Bank proxy endpoints
│   ├── calculator/           # Main calculator page
│   └── methodology/          # Methodology documentation
├── components/               # React components
│   ├── BudgetReallocation.tsx
│   ├── CostBreakdown.tsx
│   ├── CostChart.tsx
│   ├── CostPerTaxpayer.tsx
│   ├── CountrySelector.tsx
│   ├── DataFreshnessIndicator.tsx
│   ├── DetailDrawer.tsx
│   ├── GdpComparisonPanel.tsx
│   ├── HumanTollBanner.tsx
│   ├── OpportunityCost.tsx
│   ├── OpportunityGravityPanel.tsx
│   ├── RevenuePanel.tsx
│   ├── ScenarioSelector.tsx
│   ├── ShareButton.tsx
│   └── WorldMap.tsx
├── constants/                # Configuration constants
│   ├── conflict-scenarios.ts
│   └── opportunity-focus.ts
├── lib/
│   ├── api/                  # API client modules
│   │   ├── acled.ts
│   │   ├── comtrade.ts
│   │   ├── fred.ts
│   │   ├── imf.ts
│   │   ├── restcountries.ts
│   │   └── worldbank.ts
│   ├── calculations/         # Core calculation logic
│   │   ├── economic.ts
│   │   ├── haversine.ts
│   │   ├── humanitarian.ts
│   │   ├── index.ts
│   │   ├── military.ts
│   │   ├── reconstruction.ts
│   │   └── revenue.ts
│   ├── data/                 # Static datasets (JSON)
│   │   ├── bilateral-trade-shares.json
│   │   ├── commodity-producers.json
│   │   ├── conflict-costs.json
│   │   ├── displacement-ratios.json
│   │   ├── extra-countries.json
│   │   ├── opportunity-costs.json
│   │   ├── sanctions-regimes.json
│   │   ├── sipri-military.json
│   │   ├── static-fallback.json
│   │   └── validated.ts
│   └── utils/                # Utility functions
│       ├── enrichCountry.ts
│       ├── formatting.ts
│       ├── m49.ts
│       └── opportunity-icons.tsx
└── types/                    # TypeScript type definitions
    └── index.ts
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Data Fetching | [@tanstack/react-query](https://tanstack.com/query) |
| Select Components | [react-select](https://react-select.com/) |
| Mapping | [d3-geo](https://d3js.org/), [topojson-client](https://github.com/topojson/topojson) |
| Icons | [lucide-react](https://lucide.dev/) |

---

## Configuration

### Conflict Scenarios

The calculator supports four conflict scenarios:

| Scenario | Duration | Description |
|----------|----------|-------------|
| `precision_strike` | 0.05 years (~18 days) | Drones, cruise missiles, strategic bombers |
| `skirmish` | 0.2 years (~73 days) | Border clashes, limited ground offensives |
| `conventional` | 1.5 years | Full-scale ground, air, and naval operations |
| `occupation` | 10 years | Long-term military presence, counterinsurgency |

### Country Coverage

The calculator supports 194 countries including:
- All UN member states (via REST Countries API)
- Taiwan and Kosovo (curated static fallback)

---

## Contributing

Contributions are welcome! Here's how to help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- All code should be written in TypeScript
- Add JSDoc comments to new functions
- Update documentation when adding features
- Test changes locally before committing

---

## API Endpoints

### POST `/api/calculate`

Calculate war costs for a given scenario.

**Request:**
```json
{
  "aggressorCode": "USA",
  "targetCode": "RUS",
  "scenario": "conventional"
}
```

**Response:**
```json
{
  "total": { "min": 1000000000000, "max": 5000000000000, "point": 2500000000000 },
  "economicImpact": { "min": ..., "max": ..., "point": ... },
  "breakdown": {
    "military": { ... },
    "economic": { ... },
    "humanitarian": { ... },
    "reconstruction": { ... }
  },
  "duration": { "min": 0.5, "max": 3, "point": 1.5, "unit": "years" },
  "humanToll": { ... },
  "sources": [...]
}
```

### GET `/api/countries`

Get list of all selectable countries.

### GET `/api/world-bank/[indicator]`

Proxy for World Bank indicators (allowlisted).

---

## License

This project is licensed under the MIT License.

---

## Disclaimer

For educational and policy analysis purposes only. All figures are estimates based on historical benchmarks and publicly available data. Not intended to advocate for or against any conflict.

The calculations presented here are simplified models and should not be taken as precise predictions. Real-world conflicts involve unpredictable variables including political decisions, international diplomacy, technological developments, and unforeseen events.

---

## Acknowledgments

- [Watson Institute for International and Civil Society Studies](https://watson.brown.edu/) - War cost benchmarks
- [SIPRI](https://www.sipri.org/) - Military expenditure database
- [World Bank](https://data.worldbank.org/) - Economic and social indicators
- [UNHCR](https://www.unhcr.org/) - Displacement statistics
- [FRED](https://fred.stlouisfed.org/) - Economic data series

---

## Contact

For questions or feedback, please open an issue on GitHub.
