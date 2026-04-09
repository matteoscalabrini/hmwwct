# HMWWCT Frontend Redesign — Design Spec

**Date:** 2026-04-09
**Status:** Approved, ready for implementation planning
**Scope:** Full frontend rewrite across landing, calculator, and methodology pages

---

## 1. Context and goals

HMWWCT ("How Much Would a War Cost There?") is an educational calculator estimating the economic and humanitarian cost of hypothetical military conflicts, built on real data from World Bank, SIPRI, UNHCR, IMF, FRED, UN Comtrade, ACLED, Watson Institute, and REST Countries. Existing frontend is a Next 16 + Tailwind v4 + Recharts + d3-geo stack with ~16 components spread across three pages.

**Goals:**

1. Establish a distinctive visual identity that respects the subject matter's gravity.
2. Make abstract cost figures (trillions of dollars, millions of displaced people) *felt* rather than just read.
3. Unify the three pages under a coherent design language.
4. Eliminate "text all over the place" — enforce a strict, minimal hierarchy.
5. Rewrite components around terminal primitives; delete what doesn't fit.

**Non-goals:**

- Changing the calculation engine, APIs, or data schemas.
- Content rewrite of the methodology (content preserved; presentation rewritten).
- Internationalization of copy (out of scope for this pass).
- Light mode / theme toggle (single dark theme only).

---

## 2. Aesthetic direction

**Reference:** 1980s military terminals, specifically the WarGames WOPR interface. Restrained homage, not literal costume.

**Principles:**

1. **OLED black + phosphor green + max contrast.** True `#000000` base. Phosphor is the accent, used sparingly, never decoratively. One semantic red reserved for human-cost data.
2. **Vignellian hierarchy.** Five sizes, two weights, two cases. No more. Typography is the design; boxes, shadows, and gradients are forbidden. Rules (horizontal lines) carry hierarchy, not containers.
3. **Monospace everywhere, two faces.** Ioskeley Mono for ~95% of the surface; Departure Mono reserved for a single hero moment per page.
4. **Every abstract number earns a translation.** Global rule: any figure ≥ $1B carries an `≈` line making it comprehensible; any count ≥ 10,000 people gets humanized.
5. **Restraint over theatrics.** One scanline overlay is the only ambient visual effect. No bloom, no flicker, no CRT curvature, no animated transitions beyond purposeful reveals.
6. **Terminal devices are instruments.** Hover data goes to inspector strips, not tooltips. Status goes to the persistent strip, not toasts. Navigation is keyboard-first with visible hotkeys.

---

## 3. Foundation layer

### 3.1 Design tokens

Defined in `src/app/globals.css` as CSS variables. Tailwind theme is minimal; components use arbitrary values against the vars so tokens remain the single source of truth.

```css
:root {
  /* Color — OLED black phosphor */
  --bg:         #000000;
  --bg-panel:   #000000;   /* borders do the panel work, not fills */
  --fg:         #e6fff0;   /* near-white with faint green cast */
  --fg-dim:     #7a9585;   /* secondary labels */
  --fg-mute:    #3d4f44;   /* borders, gridlines, ASCII chrome */
  --phosphor:   #4aff7a;   /* the accent — used sparingly */
  --phosphor-d: #2bc957;   /* pressed/dim variant */
  --alert:      #ff3b3b;   /* human toll, casualty, warnings only */

  /* Type scale — five sizes, one job each (§3.3) */
  --t-hero:    96px;
  --t-title:   32px;
  --t-label:   12px;
  --t-body:    15px;
  --t-data:    14px;

  /* Spacing — 4px base grid */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;

  /* Borders */
  --border-1:        1px solid var(--fg-mute);
  --border-phosphor: 1px solid var(--phosphor);
}
```

### 3.2 Fonts

Self-hosted in `public/fonts/`.

- **Ioskeley Mono** (body/UI) — free Iosevka build mimicking Berkeley Mono. OFL licensed. Weights 400, 700. `font-display: swap`.
- **Departure Mono** (hero only) — free pixel-grid display face. OFL licensed. Weight 400. `font-display: block` (no FOUT on hero moments).

Global base: `font-family: "Ioskeley Mono", ui-monospace, monospace; font-feature-settings: "tnum";`

### 3.3 Type scale — Vignellian, 5 sizes

| Token | Size / Line-height | Weight | Case | Role |
|---|---|---|---|---|
| `--t-hero` | **96px / 1.0** | Regular | As-is | **The answer.** One per page, maximum. Departure Mono only. |
| `--t-title` | **32px / 1.1** | Bold | Sentence | **What this page is.** Section headings, page titles. |
| `--t-label` | **12px / 1.2** | Regular | UPPER + 0.12em tracking | **Metadata voice.** Labels, stamps, nav, status, column headers. |
| `--t-body` | **15px / 1.55** | Regular | Sentence | **Reading voice.** Prose, descriptions. Methodology only. |
| `--t-data` | **14px / 1.4** | Regular (Bold on emphasis) | Tabular figures | **Numbers voice.** All data rows, table content. |

**Face assignment:**
- `--t-hero` → Departure Mono. **The only place Departure appears.**
- Everything else → Ioskeley Mono.

**Enforcement rules:**

1. Per page, exactly **one** `--t-hero`. Not zero, not two.
2. `--t-title` appears **at most 3–4 times per page**.
3. `--t-label` never wraps.
4. Every section heading gets a full-width rule underneath it.
5. Data tables use `--t-data` with tabular figures. Bold used on at most one cell per row.
6. Body prose capped at **72ch** line length. Methodology only.
7. Any component introducing a sixth size, a second Departure location, or a second hero on a page fails review.

### 3.4 Atmosphere

Single effect: faint scanline overlay. Fixed `<div>`, `z-index: 50`, `pointer-events: none`, viewport-covering. 1px phosphor-tinted line every 3px at 3% opacity, `mix-blend-mode: screen`. Disabled under `prefers-reduced-motion`.

No bloom, no flicker, no CRT curvature, no vignette.

### 3.5 Motion

**Allowed motion:**

- **Boot sequence** — landing page only, once per session (cached in `sessionStorage`), skippable.
- **Typed reveals** — hero cost number and key stats on calculation result, ~400ms total.
- **Blinking cursor** — `█` character next to focused input and at rest next to hero number.
- **CharBar fill animation** — ~300ms on recalculation.
- **Status strip clock** — ticks once per second.

**Forbidden:**
- Animated transitions on hover/focus (terminals don't ease).
- Ambient motion beyond the clock.
- Parallax, scroll-triggered reveals, fade-ins on scroll.

**Reduced motion:** all of the above collapse to instant. Clock still updates via `requestIdleCallback` every 5s. Scanlines disabled.

### 3.6 Primitive inventory

All terminal primitives live in `src/components/terminal/`:

| File | Purpose |
|---|---|
| `Frame.tsx` | Global chrome wrapper (header + scanlines + status strip) |
| `Panel.tsx` | Bordered panel with ASCII stamp label |
| `Stamp.tsx` | `┌─ LABEL ─┐` element, reusable outside panels |
| `AsciiRule.tsx` | Horizontal rule from repeating characters |
| `BlinkCursor.tsx` | `█` blinking cursor, respects reduced-motion |
| `TypedReveal.tsx` | Type-in animation wrapper, character-by-character |
| `StatusStrip.tsx` | Persistent bottom status strip |
| `CharBar.tsx` | Character bar chart row (§6.2) |
| `DataTable.tsx` | Typed tabular data with phosphor emphasis (§6.3) |
| `BlockGridMap.tsx` | Custom world map, build-time rasterized (§6.1) |
| `PersonMemorialCanvas.tsx` | Scrolling person-icon memorial (§5 + §6.4) |
| `Key.tsx` | `[F1]` hotkey badge |
| `TerminalButton.tsx` | `> EXECUTE ▌` style action button |
| `TerminalSelect.tsx` | Full-panel typeahead for country selection |
| `sprite-factory.ts` | Shared sprite generation utility |

15 files. Everything else in the app is composed from these. Nothing custom beyond this inventory.

### 3.7 Accessibility

- All phosphor-on-black contrast verified at AA for `--t-body` and AAA for `--t-title`/`--t-hero`.
- All ASCII chrome (`┌`, `─`, `│`, `█`, `▼`) is `aria-hidden`; screen readers receive semantic equivalents.
- Focus rings are 1px phosphor outlines, overriding browser defaults.
- `prefers-reduced-motion` kills all animation including scanlines.
- `prefers-contrast: more` bumps phosphor to pure white and dim-phosphor to `#aaa` for max contrast.
- Every hotkey has a visible `[X]` label; no invisible keybindings.

---

## 4. Global chrome

Rendered once in `app/layout.tsx` via `<Frame>`. Three pieces.

### 4.1 Top header strip

- Fixed, 48px tall, full width, 1px bottom border in `--fg-mute`.
- **Left:** `HMWWCT` wordmark in Ioskeley `--t-title` phosphor + `▸ HOW MUCH WOULD…` tagline in `--t-label --fg-dim`. Clickable → `/`.
- **Right:** Nav as bracketed hotkey labels: `[/] HOME  [C] CALCULATOR  [M] METHODOLOGY`. Current route inverts (black-on-phosphor).
- Real hotkeys: `/` focuses the hero, `C` → `/calculator`, `M` → `/methodology`.
- **Mobile (<768px):** nav collapses to `[MENU]` bracket.

### 4.2 Scanline overlay

Fixed div at `z-index: 50`, pointer-events-none. `repeating-linear-gradient` of phosphor-tinted lines every 3px at 3% opacity, `mix-blend-mode: screen`. Disabled under reduced-motion.

### 4.3 Bottom status strip

- Fixed, 24px tall, full width, 1px top border in `--fg-mute`, `--t-label`.
- **`UPLINK ● NOMINAL`** — phosphor dot; changes to `QUERYING` (phosphor) or `DEGRADED` (alert red) on live fetch state.
- **`SOURCES 9/9`** — live count of reachable data sources. Replaces `DataFreshnessIndicator.tsx`.
- **`2026.04.09 14:32:07 UTC`** — live timestamp ticking every second.
- **`WOPR v2.6.1`** — app version from `package.json` (tongue-in-cheek homage).

---

## 5. Calculator page (`/calculator`) — WOPR big board

The hero page. Full-bleed, panel-divided, no scroll above 1280px.

### 5.1 Layout grid

CSS Grid, two rows.

- **Row 1 (main):** 3 columns, `280px 1fr 320px`. Min height `58vh`. Contains CONFLICT PARAMETERS (left), OPERATIONS THEATER (center), COST ANALYSIS (right).
- **Row 2 (secondary):** 4 equal columns, fixed `22vh`. Contains HUMAN TOLL, PER PERSON, INSTEAD, HISTORY.
- **Gaps:** `var(--s-4)`.

### 5.2 Panel: CONFLICT PARAMETERS (left, row 1)

Absorbs `CountrySelector.tsx` + `ScenarioSelector.tsx`.

**Country selection — full-panel typeahead:**

The selected country displays inline with a `▼` prefix. On click/focus, the *entire params panel* transforms into a search prompt:

```
> SEARCH: uni█

  UNITED STATES
  UNITED KINGDOM
  UNITED ARAB EMIRATES
  UKRAINE
  URUGUAY
```

Keyboard-driven: `↑ ↓` to navigate, `⏎` to select, `Esc` to cancel. Results filter live. This is the primary UX departure from the current app — the single most terminal-feeling moment on the page. Replaces `react-select`.

**Scenario:** Monospace radio list (`(●) CONVENTIONAL`). Selection does not animate. Selected label phosphor, others dim.

**Hotkeys:** `[A]` aggressor, `[T]` target, `[S]` cycle scenario, `[⏎]` execute.

**Execute button:** `> EXECUTE ▌` with blinking cursor. On click: label becomes `> CALCULATING...`, status strip `UPLINK` dot goes `QUERYING`.

### 5.3 Panel: OPERATIONS THEATER (center, row 1)

The hero visual: the `<BlockGridMap>` (§6.1).

- **Top chrome:** `LAT 55.7°N  LON 37.6°E  DIST 7,826KM  │  AGG GDP 10.2%  TGT GDP 142%` — GDP share moves here from its former dedicated panel.
- **Bottom-left inspector strip:** hover data lives here. No tooltips.
- **No zoom, no pan.** Instrument display, not interactive map.
- **Toggle:** `[G] GEOGRAPHY OF LOSS` — activates the translation device (§5.8.2).

### 5.4 Panel: COST ANALYSIS (right, row 1)

Absorbs `CostBreakdown.tsx`, `CostChart.tsx`, `ShareButton.tsx`, duration/displaced summary from `HumanTollBanner.tsx`.

**Structure:**

1. `TOTAL EST. COST` label (`--t-label`)
2. **Hero number** — `--t-hero`, Departure Mono, phosphor, typed-reveal on result. The page's single hero.
3. `RANGE ±$1.2T` caption (`--t-data --fg-dim`)
4. `[TAB TO CYCLE]` hint — click the hero to cycle frames (raw / per-taxpayer / per-human / years-of-education / Marshall Plans). Smart UI translation device.
5. `── BURNING AT ──` rule
6. **Live ticker** (§5.8.1): `$52,427 PER SECOND█` + `$3,145,620 since you arrived on this page`
7. `── IN HUMAN TERMS ──` rule
8. Always-visible translations block: up to 4 lines, `--t-data` value + `--t-label` descriptor
9. `── BREAKDOWN ──` rule
10. Four CharBar rows with OBITUARY punchlines (§5.8.4). Click row → opens DetailDrawer.
11. Actions footer: `[S] SHARE  [R] RESET  [D] DETAILS`

### 5.5 Row 2 — four translation lenses

The 7 current secondary components consolidate into 4 panels, each answering one question.

| Panel | Question | Absorbs |
|---|---|---|
| **HUMAN TOLL** | *Who pays with their life?* | `HumanTollBanner.tsx`. All red. Contains PersonMemorialCanvas (§5.8.3). |
| **PER PERSON** | *What do I, individually, pay?* | `CostPerTaxpayer.tsx`. YOUR SHARE device (§5.8.5). |
| **INSTEAD** | *What could this money have built?* | `OpportunityCost.tsx` + `OpportunityGravityPanel.tsx` + `BudgetReallocation.tsx`. |
| **HISTORY** | *How does this compare?* | Historical comparison chart + climate/UN anchors. |

**`RevenuePanel.tsx` resolution (deferred):** to be read during foundation pass. If it's tax-revenue framing, merges into HISTORY or PER PERSON. If it's war-revenue framing (territorial/resource gains), promotes to COST ANALYSIS as a "NET COST" line below the hero. Spec'd as a deliberate deferral.

### 5.6 DetailDrawer

Rewritten as a right-side slide-in panel. 480px wide, OLED black, 1px left border in `--phosphor`. Scanline overlay continues over it. Contains source citations and drill-down for the clicked breakdown row. Dismisses with `Esc` or `[ × ]`. Absorbs `SourceCitation.tsx`.

### 5.7 Responsive fallback (<1280px)

The big-board concept is fundamentally a desktop luxury. Below 1280px:

- Row 1's three panels stack vertically in order: **COST ANALYSIS first** (the answer), then CONFLICT PARAMETERS, then OPERATIONS THEATER.
- Row 2's four panels stack below.
- Page gains vertical scroll. Status strip stays fixed.
- Hotkey hints hidden.
- Hero number scales down: 96px → 64px.
- Inspector strip moves below the map.
- Immersive mode (§5.8.3) still available.

### 5.8 Translation devices — making numbers hit

All six approved. Each is a buildable device, not a style tweak.

#### 5.8.1 WAR CLOCK — live ticker on the hero

Below the static total cost, a live counter ticks once per second showing cost burning through in real time. Math: `total / (duration_years × 31,557,600)`.

```
$2.48T                          ← static total
─── BURNING AT ───
$52,427 PER SECOND█             ← ticks every second
$3,145,620 since you arrived    ← accumulated
```

When user returns to tab: `WHILE YOU WERE AWAY, $X WAS SPENT.` line appears briefly.

**Implementation:** `setInterval` + React state. Pauses under `prefers-reduced-motion` (shows a static per-second rate).

#### 5.8.2 GEOGRAPHY OF LOSS — map toggle

`[G]` hotkey in OPERATIONS THEATER. Activates a mode where every country whose annual GDP < total war cost lights up phosphor. A caption block lists those countries by name.

```
$2.48T ≥ THE ENTIRE ECONOMY OF 31 NATIONS
ICELAND · ESTONIA · LUXEMBOURG · LATVIA · ...
```

**Data:** leverages existing World Bank GDP data. Build-time or runtime computation both viable; runtime preferred for simplicity.

#### 5.8.3 WEIGHT IN NAMES — person-icon memorial

Replaces the current `HumanTollBanner` devices.

**Icon:** custom 4×5 pixel head-and-torso silhouette sprite:

```
 ██
████
 ██
 ██
 ██
```

Generated once at boot via `sprite-factory.ts` into an `OffscreenCanvas`. Three variants: phosphor (adult), dim phosphor (child), alert red (casualty).

**Panel view — scrolling memorial:**

A `<canvas>` in the HUMAN TOLL panel (~320×240). Figures scroll upward continuously. Each figure is one person (1:1, literal claim). At ~5 rows/second and ~53 figures per row, full 8.4M scroll takes **~8h 48m**. Counter climbs: `127,438 / 8,400,000`. Below counter: `COMPLETE IN 8H 48M AT CURRENT PACE`.

Demographic distribution from target country data (adult/child ratio, casualty ratio). Stored as a pre-computed `Uint8Array` of N bytes, one per person, generated at calculation time.

Hover in the panel reveals `▸ ONE HUMAN. AMONG 8,399,999 OTHERS.` — no invented names, just the assertion.

**Immersive mode — `[SPACE] WITNESS`:**

Opens a full-viewport portal. Black field fills with figures over ~90 seconds at ~4×6 scale with 3px gaps. A massive central counter climbs from 0 to total. Red casualty figures appear at demographically accurate rate; patterns emerge.

On completion: `THIS IS THE TARGET POPULATION DISPLACED BY THIS CONFLICT.` types in. Any keypress dismisses. `Esc` skips at any point.

**Accessibility:**
- `prefers-reduced-motion`: scroll is static frame with counter at `8.4M / 8.4M`. Immersive mode disabled.
- Screen readers: canvas is `aria-hidden` with text equivalent: `"A scrolling visual memorial showing 8,400,000 individual human figures, one per displaced person."`
- High-contrast: phosphor→white, casualties→white X.
- Immersive mode is **opt-in only**, triggered by visible hotkey, always dismissible.

**Tuning note:** pacing, size, and gap ratios will require iteration during implementation. Budget a half-day of tuning after initial build.

#### 5.8.4 OBITUARY OF SPENDING — breakdown punchlines

Each CharBar row in the COST ANALYSIS breakdown carries a one-line punchline below the bar in `--t-label --fg-dim`. Editorial, not computed — a ~30-line template library indexed by category × magnitude bucket.

```
MILITARY        ████░░   $1.2T   48%
                the price of flattening every building
                in a city of 2 million, twice.
```

Wordsmithed once, picked at render time by the category + size bucket.

#### 5.8.5 YOUR SHARE — personal opportunity cost

The PER PERSON panel. Replaces `CostPerTaxpayer.tsx`.

```
YOUR SHARE
$7,400

THAT IS:
  246 HOURS    of work at the median U.S. wage
  (six weeks of your life, unpaid)
  2,466        coffees you will not drink
  148          weekly grocery trips
  1            used car, gone
  74%          of your rent, for a year

INSTEAD, YOU COULD HAVE:
  SENT     2 students to community college
  BOUGHT   370 childhood vaccines
  INSTALLED solar panels to power your home 14 YEARS
  SPONSORED 24 children in primary school, for 1 year
```

**Data:** small curated dataset of per-person opportunity costs (vaccine cost, tuition, solar, etc.) and median wage per country. All publicly documented values; static data file.

#### 5.8.6 HISTORY — comparative frame

The HISTORY panel. CharBar rows for historical anchors, current conflict highlighted.

```
▸ THIS WAR                $2.48T   ██████░░░░░░░
  IRAQ + AFGHANISTAN      $8.00T   ██████████████
  VIETNAM (adj 2025)      $1.10T   ███░░░░░░░░░░
  APOLLO PROGRAM (adj)    $0.28T   █░░░░░░░░░░░░
  MARSHALL PLAN (adj)     $0.13T   ░░░░░░░░░░░░░
  GLOBAL CLIMATE GOAL/YR  $0.30T   █░░░░░░░░░░░░
  UN ANNUAL BUDGET        $0.05T   ░░░░░░░░░░░░░

$2.48T  >  EVERY UN OPERATION FOR 49 YEARS
$2.48T  >  THE GLOBAL CLIMATE COMMITMENT × 8 YEARS
```

Static dataset of historical anchors (inflation-adjusted to current year at build time).

### 5.9 Global translation rule

Every figure ≥ $1B on any page carries an `≈` translation line in `--t-data --fg-dim` immediately below. Every count ≥ 10,000 people gets humanized. Applies to calculator *and* methodology.

---

## 6. Data viz primitives

### 6.1 `<BlockGridMap>` — highest-risk component

**Replaces:** `WorldMap.tsx` + runtime `d3-geo`/`topojson-client` dependencies on the map path.

**Technique: build-time rasterization.**

A build script (`scripts/build-map-grid.ts`, runs during `next build`):

1. Loads the existing TopoJSON.
2. Uses `d3-geo` in Node with equirectangular projection at **160 × 80** cells (draft resolution; tunable).
3. Crops to **±75° latitude** (drops Antarctica and extreme polar regions for proportional accuracy in populated areas).
4. For each grid cell, point-in-polygon test against country polygons.
5. Outputs `src/lib/data/map-grid.json` — 2D array of `string | null` (ISO3 or ocean). ~40KB gzipped.

**Runtime component:**

```tsx
<BlockGridMap
  aggressor="USA"
  target="RUS"
  mode="default" | "geography-of-loss"
/>
```

- Canvas-based. Loads static grid once, cached in React context.
- Paint rules:
  - Ocean → black (skip).
  - Neutral land → dim phosphor (`--fg-mute`).
  - Aggressor → bright phosphor.
  - Target → alert red (the second place red appears on the page; deliberate — the map says "this is where the war happens").
  - `geography-of-loss` mode → every country with GDP < total cost glows bright phosphor.
- 4×4 px squares with 1px gaps (draft sizing).
- Prime meridian + equator faintly drawn as coordinate cues.

**Great-circle line:** precomputed at selection time, drawn as a dashed path of phosphor characters (`· · · · ·`) bending over the projection. Endpoints pulse once on update (single 300ms phosphor flash).

**Hover:** second overlay canvas for the hover outline (avoids full repaint on mousemove). Data → inspector strip, never tooltips.

**Dependencies:** `d3-geo` and `topojson-client` move to `devDependencies` (still needed in build script).

**Risks:**
- Grid resolution tuning requires iteration — build script supports resolution as arg.
- Hit-detection precision below 480px viewport → degrades to tap-select list of ~40 most relevant nations.

### 6.2 `<CharBar>` — the char-bar primitive

**Replaces:** `CostChart.tsx` and all Recharts usage.

DOM-based (not canvas — used many places, DOM simpler for layout).

```tsx
<CharBar
  label="MILITARY"
  value={0.48}            // 0..1
  displayValue="$1.2T"
  width={20}              // total cells
  tone="default" | "alert" | "phosphor-bright"
  translation="the price of flattening…"  // optional OBITUARY line
/>
```

Renders:
```
MILITARY       ████████████░░░░░░░░  $1.2T   48%
               the price of flattening every building
               in a city of 2 million, twice.
```

- Filled cells = `█` in phosphor, empty = `░` in `--fg-mute`.
- Tabular numerics right-align across rows.
- On recalc, animates `filled` count over ~300ms via `requestAnimationFrame`.
- `translation` prop renders optional second line in `--t-label --fg-dim`.

**Used by:** COST ANALYSIS breakdown, PER PERSON, INSTEAD, HISTORY, map chrome.

### 6.3 `<DataTable>` — typed tabular data

**Replaces:** ad-hoc tables in `GdpComparisonPanel`, `CostPerTaxpayer`, etc.

```tsx
<DataTable>
  <DataTable.Row label="DURATION" value="1.5 YEARS" />
  <DataTable.Row label="DISPLACED" value="8.4M" tone="alert" />
</DataTable>
```

Renders:
```
DURATION     │  1.5 YEARS
DISPLACED    │  8.4M          ← red
```

- CSS Grid, 2 columns: `max-content 1fr`.
- `│` is a real character (not a border) in `--fg-mute`.
- Labels `--t-label`, values `--t-data` with tabular figures.
- Optional `highlight` prop inverts the row.

**Used by:** every panel that isn't purely a CharBar. COST ANALYSIS summary, HUMAN TOLL demographics, map chrome, DetailDrawer, StatusStrip.

### 6.4 `<PersonMemorialCanvas>`

Full spec in §5.8.3. Technical summary:

- Single `<canvas>` sized to parent.
- `requestAnimationFrame` loop scrolls upward; draws a new row of figures at bottom every N frames.
- Blits sprites from `sprite-factory.ts` (pre-rendered `OffscreenCanvas`es).
- Demographic sequence pre-computed as `Uint8Array` (1 byte/person; 8.4MB for 8.4M people — acceptable).
- Immersive mode: portal component with larger canvas, faster paint pace (~90k figures/sec, ~90s total).

---

## 7. Landing page (`/`)

Scrolling editorial. Three acts.

### 7.1 Act 1 — Boot sequence

First visit only (session-cached). Viewport black, scanlines fade in, typed sequence in Ioskeley `--t-label`:

```
> BOOTING WOPR INTERFACE . . . OK
> LOADING CONFLICT DATABASE . . . 194 NATIONS INDEXED
> UPLINK : WORLD BANK · SIPRI · UNHCR · FRED · IMF . . . NOMINAL
> LAST CALIBRATION : IRAN · 2026
> READY.
>
> SHALL WE PLAY A GAME?
```

~6 seconds total. Skippable via any keypress/click. `prefers-reduced-motion` skips entirely.

### 7.2 Act 2 — The hook

Full-viewport, centered composition (the one place centered text is allowed):

```
                    HMWWCT
      HOW MUCH WOULD A WAR COST THERE?

    ─────────────────────────────────────────

      A CALCULATOR FOR THE ECONOMIC AND
      HUMANITARIAN COST OF HYPOTHETICAL
      CONFLICT, BUILT FROM REAL DATA.

            [ ⏎ ] BEGIN CALCULATION

      ─── CURRENTLY TRACKING ───

      9 / 9  DATA SOURCES LIVE
      194    COUNTRIES INDEXED
      2026   FIGURES CURRENT
```

- **Hero:** `HMWWCT` title in Departure Mono `--t-hero` phosphor. This page's one hero.
- **CTA:** `[ ⏎ ] BEGIN CALCULATION` — the `⏎` hotkey actually works.
- **Status triplet:** pulled from real data sources, not marketing copy.

### 7.3 Act 3 — The weight (scrolling)

Three framed sections:

1. **`┌─ WHY THIS EXISTS ─┐`** — two paragraphs of Ioskeley body text, 72ch, explaining purpose.
2. **`┌─ THE CALCULATION, IN ONE LINE ─┐`** — formula as typography:
   ```
   > COST = MILITARY + ECONOMIC + HUMANITARIAN + RECONSTRUCTION
   >
   > MILITARY       = WATSON_RATE × BUDGET_SCALE × DISTANCE × DURATION
   > ECONOMIC       = TRADE_LOSS + GDP_CONTRACTION + SANCTIONS + COMMODITY
   > HUMANITARIAN   = DISPLACED × PER_PERSON_COST × TAIL_YEARS
   > RECONSTRUCTION = TARGET_GDP × RECON_RATE × DURATION
   ```
3. **`┌─ DATA LINEAGE ─┐`** — full DataTable of every data source with role and live status. The pitch is the receipts.
4. **Final CTA:** `[ ⏎ ] BEGIN CALCULATION   [ M ] READ METHODOLOGY`

**Excluded:** testimonials, "as seen in," example screenshots, FAQ, email capture, cookie banner, feature grids, illustrations.

### 7.4 Composition

Zero new components. Landing is composed from `<Frame>`, `<Panel>`, `<Stamp>`, `<TypedReveal>`, `<BlinkCursor>`, `<DataTable>`, `<AsciiRule>`.

---

## 8. Methodology page (`/methodology`)

Longform terminal printout. Single column, left-aligned, 72ch body max. Reading-heavy; no panels or grids.

### 8.1 Structure

- **Title** (`--t-hero`, Departure, two lines): `HOW HMWWCT CALCULATES / THE COST OF A HYPOTHETICAL WAR`. Page's one hero.
- **Metadata strip:** last calibration date + version, `--t-label --fg-dim`.
- **Table of contents:** numbered list `[01]`..`[09]`. Each is an anchor. Typing a number jumps to that section.
- **Section headings:** `--t-title` with full-width phosphor rule underneath.
- **Body prose:** `--t-body` Ioskeley, 72ch cap, `--s-5` paragraph spacing.
- **Formulas:** indented terminal-command blocks:
  ```
  > MILITARY_COST = WATSON_RATE × BUDGET_SCALE × DISTANCE_DISCOUNT × DURATION
  >
  > where:
  >   WATSON_RATE     = $2.4B/day (Afghanistan-anchored reference)
  >   BUDGET_SCALE    = aggressor_milex / $700B
  >   DISTANCE_DISC.  = max(0.6, 1 - log(distance_km / 5000))
  >   DURATION        = scenario.median_years
  ```
  Phosphor for variables, regular for operators, `--fg-mute` for brackets.
- **Tables** via `<DataTable>`.
- **Footnotes:** bracketed `[1]` inline, collected per-section.
- **No images, no diagrams, no charts.**

### 8.2 Sidebar navigation

Fixed left sidebar at ≥1280px: numbered section list `[01]`..`[09]`, current section inverted (phosphor background). Below 1280px hidden; top-of-page TOC is the only nav.

### 8.3 Inline translations

Global rule applies. Example:

> The daily rate anchor is $2.4 billion, derived from Watson Institute analysis of US operations in Afghanistan.
>
> ≈ $27,778 per second
> ≈ the annual budget of the World Food Programme, every 4 days

Methodology becomes more teachable. Not a content rewrite — a strategic insertion pass at the largest numbers.

### 8.4 Progress indicator

Fixed bottom-left, above status strip:
```
READING [██████░░░░░░░░] 38%  §03 ECONOMIC IMPACT
```

Static until scroll.

### 8.5 Content preservation

The calibration report (Iran 2026) and armaments module sections from recent commits stay where they are. Content preserved; only rendering rewritten. Existing MDX (if present) is kept; rendering layer (component mapping) is rewritten.

---

## 9. Implementation strategy — Approach 2 (calculator-first)

1. **Phase 1 — Foundation.** Install fonts. Write tokens in `globals.css`. Build all 15 primitives as isolated components with minimal smoke tests. Wire `<Frame>`, `<StatusStrip>`, scanline overlay into `app/layout.tsx`. Audit: every existing size/color reference in the codebase mapped to a token. **Resolve `RevenuePanel.tsx` placement.**
2. **Phase 2 — Calculator.** Build the big-board layout. Build `<BlockGridMap>` (highest risk, do first). Build `<PersonMemorialCanvas>` and immersive mode. Build all row-1 and row-2 panels. Wire translation devices. Build full-panel typeahead. Delete all old calculator components.
3. **Phase 3 — Landing.** Boot sequence. Hook composition. Weight sections. Final CTAs. (Fast — pure composition of primitives.)
4. **Phase 4 — Methodology.** Restyle layout. Sidebar nav. Progress indicator. Strategic pass inserting inline translations at major figures. (Fast — mostly typography.)
5. **Phase 5 — Polish.** Tune PersonMemorialCanvas pacing and sizing. Tune BlockGridMap resolution. Audit hierarchy rules across all three pages. Responsive fallback testing. Accessibility sweep (reduced-motion, screen readers, contrast, focus rings).

**Why calculator-first:** de-risks the two hardest components (BlockGridMap, PersonMemorialCanvas) early. Landing and methodology are dessert.

---

## 10. Components deleted or rewritten

Every existing component in `src/components/` is either deleted or rewritten.

| Component | Fate |
|---|---|
| `BudgetReallocation.tsx` | Deleted; merged into INSTEAD panel |
| `CostBreakdown.tsx` | Deleted; absorbed into COST ANALYSIS |
| `CostChart.tsx` | Deleted; replaced by `<CharBar>` |
| `CostPerTaxpayer.tsx` | Deleted; merged into PER PERSON panel |
| `CountrySelector.tsx` | Deleted; replaced by `<TerminalSelect>` |
| `DataFreshnessIndicator.tsx` | Deleted; absorbed into `<StatusStrip>` |
| `DetailDrawer.tsx` | Rewritten as terminal-styled slide-in (name kept) |
| `GdpComparisonPanel.tsx` | Deleted; GDP share moves to map chrome |
| `HumanTollBanner.tsx` | Deleted; rewritten as HUMAN TOLL panel |
| `OpportunityCost.tsx` | Deleted; merged into INSTEAD |
| `OpportunityGravityPanel.tsx` | Deleted; merged into INSTEAD |
| `RevenuePanel.tsx` | Resolved during Phase 1 (merges into HISTORY, PER PERSON, or promotes to COST ANALYSIS) |
| `ScenarioSelector.tsx` | Deleted; inlined into CONFLICT PARAMETERS |
| `ShareButton.tsx` | Deleted; inlined into COST ANALYSIS actions footer |
| `SourceCitation.tsx` | Deleted; absorbed into DetailDrawer |
| `WorldMap.tsx` | Deleted; replaced by `<BlockGridMap>` |
| `ui/` | Deleted (pending verification that nothing external depends) |

**This is a full rewrite, not a reskin.** Explicit and intentional.

---

## 11. Open items resolved during implementation

1. **`RevenuePanel.tsx` placement** — read during Phase 1; route to HISTORY, PER PERSON, or COST ANALYSIS.
2. **BlockGridMap resolution** — try 160×80, 200×100, 120×60 during Phase 2; pick based on readability.
3. **PersonMemorialCanvas pacing** — tune during Phase 5; target "individual figures visible during scroll" + "total time > 1 hour" as the two constraints.
4. **OBITUARY punchline template library** — wordsmith during Phase 2 (editorial task, ~30 lines).
5. **Per-person opportunity cost dataset** — curate during Phase 2 (vaccines, tuition, solar, etc.).
6. **Historical anchor dataset** — curate during Phase 2 (inflation-adjusted at build time).
7. **Translation cycle frames** for click-to-cycle hero number — enumerate during Phase 2.

---

## 12. Risks

1. **BlockGridMap rasterization fidelity.** Mitigation: build script supports resolution tuning; test multiple values early in Phase 2.
2. **PersonMemorialCanvas performance on low-end devices.** Mitigation: canvas rendering is highly optimized; measure on real mobile devices during Phase 5; degrade gracefully under reduced-motion.
3. **Scope creep during translation-device tuning.** Mitigation: Phase 5 has an explicit budget; devices ship "good enough" on first pass and iterate only where necessary.
4. **Accessibility regressions.** Mitigation: reduced-motion and screen-reader paths are first-class requirements in each primitive, not afterthoughts.
5. **Component deletion breaking routes.** Mitigation: Phase 2 deletes old calculator components only after new ones are complete; old imports detected by TypeScript.

---

## 13. Out of scope

- Light mode / theme toggle.
- I18n / translation of UI copy.
- User accounts, saved calculations, history.
- Social share image generation (beyond current state).
- Server-side rendering changes to API routes or calculation logic.
- Mobile app or PWA features.
- Any content rewrite of the methodology beyond inline `≈` translations.

---

## 14. Approval log

| Section | Approved |
|---|---|
| Aesthetic direction (terminal, restrained homage) | ✓ |
| Palette (OLED black + phosphor + alert red) | ✓ |
| Typography (Ioskeley Mono + Departure Mono, Vignellian 5-size scale) | ✓ |
| Atmosphere (scanlines only, no bloom) | ✓ |
| Motion (boot sequence + typed reveals + cursor, all opt-out under reduced-motion) | ✓ |
| Data viz (all custom, no Recharts) | ✓ |
| Layout (hybrid — landing scrolls, calculator is big board, methodology scrolls) | ✓ |
| Implementation strategy (Approach 2, calculator-first) | ✓ |
| Foundation layer | ✓ |
| Global chrome | ✓ |
| Calculator page — big board layout | ✓ |
| Calculator page — 7→4 secondary panel consolidation | ✓ |
| Calculator page — full-panel typeahead for country selection | ✓ |
| Translation devices — all six (WAR CLOCK, GEOGRAPHY OF LOSS, WEIGHT IN NAMES, OBITUARY, YOUR SHARE, HISTORY) | ✓ |
| Person memorial — icon style #3 (head-and-torso silhouette) | ✓ |
| BlockGridMap — crop to ±75° latitude (drop Antarctica) | ✓ |
| Full rewrite framing (every existing component deleted or rewritten) | ✓ |
| Landing page | ✓ |
| Methodology page | ✓ |
