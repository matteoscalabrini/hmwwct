# Armament Cost Integration — Research Report

**Date:** March 2026
**Purpose:** Evaluate feasibility of adding armament/weapons procurement costs to the HMWWCT war cost calculator.

---

## Background

The current calculator estimates war costs across several categories (personnel, operations, infrastructure, economic disruption, etc.) but does not account for **armament costs** — the cost of the weapons systems themselves. This is a significant gap: in modern conventional conflicts, weapons procurement and attrition replacement can represent a substantial share of total war expenditure.

---

## The Three Buckets of Armament Cost

Any implementation must distinguish between three fundamentally different cost types:

### 1. Procurement
The upfront capital cost of acquiring weapons systems *before or during* a conflict. This is what a nation pays to field a capable force.

- Examples: 100 F-16s × $65M = $6.5B; 1 Arleigh Burke destroyer = $2B
- Data source: DoD "Program Acquisition Costs by Weapon System" (published annually)
- Nature: **one-time capital expenditure**, amortized over the conflict duration

### 2. Attrition Replacement
The cost of replacing weapons systems destroyed or captured in combat. This is *additional* spending on top of pre-war inventories.

- Real-world calibration: The GAO Ukraine study (2024) found $25.9B in US replacement funding after initial inventory drawdowns — ammunition, missiles, and combat vehicles dominated
- Nature: **conflict-driven, highly variable** — depends on intensity and duration

### 3. Munitions Consumption
The ongoing cost of shells, bombs, and missiles *expended* in operations. Not the systems themselves, but what they fire.

- RAND estimates for Ukraine: $16–28B/year (defensive posture) to $43–57B/year (offensive posture)
- Nature: **recurring operational cost**, scales with conflict duration and intensity

---

## Available Data Sources

### Fully Public REST APIs

| Source | Data Available | Auth | URL |
|---|---|---|---|
| **World Bank API** | Military spend % GDP + arms imports/exports (SIPRI TIV) by country, all years | None | `api.worldbank.org/v2/countries/{iso}/indicators/MS.MIL.XPND.CD` |
| **USASpending.gov API** | Actual US weapons contract values by PSC code (granular, contract-level) | None | `api.usaspending.gov/api/v2/` |

The World Bank API is the most practical for this project: it exposes military expenditure in current USD per country using the same ISO codes already used throughout the codebase. It is well-documented, stable, and requires no authentication.

### Downloadable Static Files (Annual Updates)

| Source | Data Available | URL |
|---|---|---|
| **SIPRI Milex Excel** | Military expenditure 1949–2024 by country in USD, local currency, % GDP | `sipri.org/sites/default/files/SIPRI-Milex-data-1949-2024_2.xlsx` |
| **NATO Defence Expenditure** | Equipment spending by NATO member 2014–2025, including major equipment % | `nato.int/content/dam/nato/webready/documents/finance/def-exp-2025-en.xlsx` |
| **Bruegel FMS Dataset** | US Foreign Military Sales by purchasing country + equipment type, 2008–2025 | `bruegel.org/dataset/us-foreign-military-sales` |

### Unofficial / Scraping-Based

| Source | Data Available | Notes |
|---|---|---|
| **SIPRI Arms Transfers POST export** | Weapons transfers by country pair in TIV (not USD) | Undocumented POST endpoint; data is TIV not money — useful only as a scaling weight, not a price |

### Subscription Only (Not Usable)

| Source | Why Relevant | Status |
|---|---|---|
| **IISS Military Balance+** | Best source for per-country force packages and procurement as % of budget | Subscription only, no API |
| **Jane's Defence** | Standard reference for per-platform unit costs | Subscription only |

---

## Why There Is No Live API for Weapons Unit Prices

This is the critical limitation: **there is no public API that returns "an F-35 costs $80M".**

Per-unit weapon prices come from:
- DoD annual budget justification documents (PDFs)
- Congressional Budget Office cost estimates (PDFs)
- GAO program acquisition reports (PDFs)

These are published as static documents, not machine-readable APIs. The figures change slowly (1–3% per year for inflation). The practical solution used by all researchers is a **static lookup table** maintained manually, sourced from these annual reports.

---

## Proposed Implementation Architecture

### Layer 1: Live Data (World Bank API)
Fetch each country's **total military expenditure** in current USD at runtime. This already aligns with how `military.ts` works.

```
GET https://api.worldbank.org/v2/countries/{iso}/indicators/MS.MIL.XPND.CD?format=json&mrv=1
```

Returns: most recent year's military spend in current USD. Use this to derive a **procurement budget fraction** (typically 20–30% of total military spend goes to equipment procurement, per NATO data).

### Layer 2: Static Unit Cost Table (`/src/lib/armaments/unitCosts.ts`)
A bundled lookup table of ~20 weapon categories with DoD-sourced unit costs:

| Category | Example Systems | Unit Cost (approx.) |
|---|---|---|
| Cruise missile | Tomahawk, Storm Shadow | $1.5–2.5M |
| Short-range missile | AIM-120, Javelin | $0.1–0.5M |
| Fighter aircraft | F-16, Su-27, Rafale | $50–120M |
| Attack helicopter | Apache, Ka-52 | $30–70M |
| Main battle tank | M1 Abrams, T-90, Leopard 2 | $6–15M |
| Infantry fighting vehicle | Bradley, BMP-3 | $3–8M |
| Self-propelled artillery | M109, 2S19 Msta | $4–7M |
| Destroyer / frigate | Arleigh Burke | $1.8–2.5B |
| Submarine | Virginia-class | $3.5B |
| Aircraft carrier | Ford-class | $13B |
| Strategic bomber | B-2, Tu-160 | $2–2.5B |
| Air defense battery | Patriot, S-400 | $0.5–1B |
| Drone (tactical) | Bayraktar TB2, Shahed | $2–5M |
| Artillery shell (155mm) | Standard NATO round | $800–3,000 |
| Precision bomb | JDAM, GBU-39 | $20–80K |

### Layer 3: Scenario Force Package Table (`/src/lib/armaments/scenarios.ts`)
Maps each existing conflict scenario to a typical force package:

| Scenario | Force Package | Logic |
|---|---|---|
| `precision_strike` | 50–200 cruise missiles + air support sorties | No ground forces |
| `border_skirmish` | 1 armored brigade + tactical air + artillery | ~72 hours intensity |
| `conventional_war` | Division-level: 300 tanks, 600 IFVs, 200 artillery, 150 aircraft | Full combined arms |
| `occupation` | Light garrison: vehicles, drones, logistics | Low intensity sustained |
| `naval_blockade` | 2–4 destroyers + submarines + maritime patrol aircraft | No ground component |

Scale each force package by:
1. A **country wealth scalar** derived from `militaryBudget / medianGlobalMilitaryBudget`
2. Conflict **duration multiplier** for attrition and munitions consumption

---

## Methodological References

- **Bilmes & Stiglitz** — "Estimating the Costs of War" (Harvard Kennedy School): canonical framework distinguishing budgetary from economic costs
- **Brown University Costs of War Project** — ongoing public scholarship; best US-focused accounting framework
- **GAO-24-106649** — "Ukraine: Status and Challenges of DOD Weapon Replacement Efforts": real-world attrition cost model
- **RAND** — multiple publications on Ukraine munitions requirements; best data on consumption rates
- **CAPE DoD Cost Estimating Guide (2020)** — authoritative methodology for parametric, analogical, and engineering build-up cost estimates

---

## Pros and Cons of Implementing This

### Pros

- **Fills the biggest gap in the model.** Armaments are arguably the most visible cost of war — tanks, planes, missiles. Not including them makes the total feel incomplete.
- **Grounded in real data.** The World Bank API and DoD unit cost figures are solid, well-sourced, and defensible. Not speculative.
- **Architecturally clean.** The existing calculation module structure (`military.ts`, `economic.ts`, etc.) has a natural slot for a new `armaments.ts`. No structural changes needed.
- **Adds meaningful scenario differentiation.** A precision strike vs. a conventional war looks very different in armament terms — this would make scenarios feel more distinct and realistic.
- **Educationally powerful.** Showing users that a single Arleigh Burke destroyer costs $2B, or that a Tomahawk salvo of 100 missiles = $200M, makes the numbers tangible in a way abstract totals don't.
- **Live data component is already mostly available.** The World Bank API for total military spending per country is free, documented, stable, and requires no auth.

### Cons

- **No live API for unit prices.** The core weapon cost table must be manually maintained — this is not a fully automated live data feed. Unit costs need periodic review.
- **TIV ≠ USD.** SIPRI's arms transfer data uses Trend Indicator Values, not actual contract prices. It cannot be directly converted to dollar figures. You would need to use it only as a scaling weight, not as a price.
- **Force package assumptions are inherently speculative.** "A conventional war deploys 300 tanks" is a reasonable estimate, not a precise figure. Different experts would choose different numbers. This introduces model uncertainty.
- **Non-US weapons data is sparse.** DoD unit costs are well-documented for US systems. For Russian, Chinese, or other country equipment, public unit cost data is much patchier. The static table would need to be approximate for non-NATO weapons.
- **Adds UI complexity.** A new cost category needs a new breakdown line, potentially a new chart segment, and explanation text. The UI is currently clean — care needed not to clutter it.
- **Risk of false precision.** Adding granular-looking armament figures (e.g., "$4.7B in munitions consumption") could give users false confidence in estimates that carry high uncertainty. Should be clearly labeled as estimates/ranges.
- **Maintenance burden.** Unit costs, procurement fractions, and force package definitions would need to be reviewed whenever major weapons programs change or new conflicts provide calibration data.

---

*End of report.*
