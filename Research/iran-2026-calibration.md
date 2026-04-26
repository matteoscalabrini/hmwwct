# Real-World Calibration Report: Operation Epic Fury (Iran, 2026)

**Date:** March 16, 2026; reassessed April 26, 2026
**Author:** HMWWCT Development Session
**Purpose:** Document the process of using a live conflict to validate and improve the war cost calculator.

---

## 1. Background

On February 28, 2026, the United States and Israel launched coordinated surprise airstrikes against Iran (Operation Epic Fury / Operation Roaring Lion). By Day 17 (March 16, 2026), partial cost data had been reported by the Pentagon, CSIS, and multiple congressional sources — giving us an unusually rare opportunity: a live conflict with real cost data available while the model was running.

This report documents how we used that data to identify gaps, re-run the calculator, and apply targeted improvements to the underlying algorithms.

## April 26 Reassessment

A month of additional reporting changed the validation frame:

- CSIS now describes the campaign as more than 13,000 targets struck over 39 days before a ceasefire.
- Penn Wharton’s current benchmark is no longer a $65B sub-two-month headline. It estimates $27-28B in U.S. federal direct spending through Day 32 and $38-47B through April 30, excluding roughly $5B in indirect costs.
- HRANA’s Day 39 documentation records 1,701 civilian fatalities, 1,221 military fatalities, and 714 unclassified fatalities in Iran, for 3,636 documented deaths.
- HRA/Airwars/CIVIC report approximately 3.2M displaced people in Iran, consistent with earlier UN-reported displacement.
- FDD’s initial economic-damage estimate for Iran is $50-300B, with a most likely estimate of about $144B.

**Validation verdict after reassessment:**

| Model area | Current match |
|---|---|
| Human toll deaths | Strong. A 39-day air_campaign run estimates 3,571 killed vs HRANA’s 3,636 documented deaths. |
| Displacement | Fixed. The code had double-damped air-campaign displacement, producing only 293K displaced. It now estimates 3.66M, close to the reported ~3.2M. |
| Economic impact | Reasonable. The 39-day model estimates $191.7B vs FDD’s $144B most likely estimate and $50-300B range. |
| Direct U.S. military cost | Mixed/high. Military + armaments at 39 days estimates $45.86B, above a likely Day 39 extrapolation from PWBM but near PWBM’s $38-47B two-month projection. |
| Headline calculator total | Not directly comparable to public budget estimates because the calculator includes humanitarian and reconstruction categories that PWBM excludes. |

---

## 2. The Conflict at a Glance

| Parameter | Value |
|---|---|
| Aggressors | United States + Israel |
| Target | Iran (Islamic Republic) |
| Start date | February 28, 2026 |
| Nature | Sustained air campaign + naval strikes. No US/Israeli ground forces inside Iran. |
| US operation name | Operation Epic Fury |
| Israeli operation name | Operation Roaring Lion |
| Day of calibration | Day 17 (March 16, 2026) |

**Key facts at Day 17:**
- 1,600+ Israeli sorties into Iranian territory
- 5,500+ targets struck inside Iran (US + Israel combined)
- 160+ Tomahawk cruise missiles in the opening salvo
- Iran fired ~700 ballistic missiles + ~3,600 drones at US/Israeli targets
- 1,444+ killed in Iran; 18,551+ injured; ~3.2 million displaced
- 7 US service members killed; 140 wounded
- Brent crude oil: $70/barrel before war → $119.50 intraday peak (March 9)
- Strait of Hormuz disrupted; ~1,000 ships blocked

---

## 3. Real Cost Data Collected

Multiple independent sources reported partial cost figures by Day 17:

| Timeframe | Cost | Source |
|---|---|---|
| First 100 hours | $3.7B ($891M/day) | CSIS analysis |
| First 36 hours (munitions only) | $5.6B | Pentagon / Washington Post |
| First 6 days | $11.3B ($1.88B/day) | Pentagon (Senate briefing) |
| First 12–13 days | ~$14–16.5B | CSIS / Foreign Policy |
| First 32 days | $27–28B | Penn Wharton Budget Model |
| Projected through April 30 | $38–47B direct, plus ~$5B indirect excluded | Penn Wharton Budget Model |

**CSIS breakdown of first 100 hours:**

| Sub-category | Cost | % of total |
|---|---|---|
| Offensive munitions | $1.5B | 40% |
| Defensive intercepts (vs Iranian BMs/drones) | $1.7B | 46% |
| Equipment losses (3× F-15EX at ~$103M each) | $359M | 10% |
| Operations & sustainment | $196M | 5% |
| **Total** | **$3.7B** | |

The most striking finding: **defensive intercept costs (46%) exceeded offensive strike munitions costs (40%)** in the opening phase. This was driven by Iran's immediate and sustained ballistic missile and drone response — a cost category that did not exist in the original calculator.

---

## 4. Initial Calculator Output (Pre-Fix)

We ran the calculator against the real scenario using the closest available scenario at the time: `precision_strike` (USA → IRN).

**Calculator output — `precision_strike` (18 days):**

| Category | Calculator | Real (Day 13–17) |
|---|---|---|
| Military | $4.48B | — |
| Armaments | $8.50B | — |
| Humanitarian | **$14M** | **~$2B+ (1,444 killed, 3.2M displaced)** |
| Reconstruction | $310M | — |
| **TOTAL direct** | **$13.30B** | **$14–16.5B** |
| Economic impact | $181.67B | $500B+ (global oil shock) |

**Headline accuracy: $13.3B vs $14–16.5B real — within the model's own range.**

Despite the headline number being close, the analysis revealed that the calculator was achieving accuracy for the wrong reasons — two errors were cancelling each other out:

1. **Humanitarian was massively underestimated** ($14M vs billions in reality)
2. **Force package procurement was likely overestimated** for what is essentially a strike campaign, not a standing force deployment

The model was also missing the `air_campaign` scenario entirely, forcing the real conflict into `precision_strike` which calibrated to only 18 days. The actual conflict was already at Day 17 with no end in sight.

---

## 5. Gap Analysis

### Gap 1 — No defensive intercept costs

The biggest structural gap. Shooting down incoming ballistic missiles and drones costs as much as offensive strikes — sometimes more. This cost did not exist anywhere in the model.

**Real data:** $1.7B in intercept costs in the first 100 hours alone. Average intercept cost ≈ $395K per threat (mix of Patriot PAC-3 at $4M, SM-3 at $10M, SM-2 at $2M, Iron Dome at $80K).

**Root cause:** The model was built around aggressor cost only. The defender's counter-fire — and the aggressor's cost to neutralize it — was entirely missing.

### Gap 2 — No `air_campaign` scenario

The four existing scenarios were: `precision_strike` (days), `skirmish` (weeks), `conventional` (months–years), `occupation` (years–decades). There was no scenario representing what Iran 2026 actually was: a sustained air campaign lasting weeks to months with no ground component.

The `precision_strike` scenario assumed 18 days at point estimate, while `conventional` assumed 1.5 years with ground forces. Iran 2026 fell in the gap between them.

### Gap 3 — Humanitarian model built for slow conflicts

The displacement-based humanitarian model worked well for multi-year ground wars (Afghanistan, Syria) but broke down for short, high-intensity air campaigns:

- The `precision_strike` `displacementMultiplier` of 0.01 (1%) produced ~20,000 displaced people for Iran's 89M population — vs 3.2M real
- No direct casualty cost existed in the model at all — casualties were shown in the UI as a human toll figure but not monetized
- The model assumed humanitarian costs accumulate gradually over months; in reality, air campaigns kill thousands in days

### Gap 4 — Capital flight not calibrated for air campaigns

The `CAPITAL_FLIGHT_PCT` map in the economic module had entries for `skirmish`, `conventional`, and `occupation` but defaulted to 4% for both `precision_strike` and `air_campaign`. Iran's banking system was effectively frozen and oil exports halted within days — a 7%+ capital flight rate, not 4%.

### Gap 5 — Air-campaign displacement was double-damped

The methodology intended `air_campaign.displacementMultiplier = 0.04` to mean "about 4% of the target population displaced," calibrated from Iran's reported 3.2M displaced out of roughly 89M people.

The implementation instead calculated:

```text
populationAtRisk x UNHCR historical displacementRatio x scenarioDisplacementMultiplier
```

For Iran, the UNHCR ratio is 8%, so the code used `0.08 x 0.04 = 0.0032`, producing only ~293K displaced in the air-campaign scenario. That contradicted the written methodology and the validation data.

---

## 6. Fixes Applied

### Fix 1 — Defensive intercept costs (`armaments.ts`)

**Implementation:**
Added a new `Defensive Intercepts (Ballistic Missiles & Drones)` line item to the armaments module.

**Methodology:**
- Incoming threat volume scales with target's military budget (larger military = more ballistic missile/drone capability)
- Per-scenario daily threat rate (threats per $100B target budget):
  - `precision_strike`: 150/day/100B — target fights back but short duration
  - `air_campaign`: 300/day/100B — sustained barrage, calibrated to Iran 2026 rate
  - `conventional`: 200/day/100B — full war includes ballistic missiles
  - `skirmish`: 50/day/100B — mostly artillery, few ballistic missiles
  - `occupation`: 30/day/100B — insurgency: IEDs, mortars, sporadic rockets
- Average intercept cost: $395K (calibrated from CSIS Iran 2026 analysis)
- Intercept rate: 85%

**Calibration source:** CSIS "$3.7 Billion: Estimated Cost of Epic Fury's First 100 Hours" (2026)

### Fix 2 — `air_campaign` scenario (`types/index.ts`, `conflict-scenarios.ts`, `route.ts`, `ScenarioSelector.tsx`)

**Implementation:**
Added a fifth conflict scenario between `precision_strike` and `skirmish`.

**Parameters:**

| Parameter | Value | Rationale |
|---|---|---|
| Duration | 0.05–0.5 years, point 0.15 (55 days) | Kosovo: 78 days; Iran 2026: ongoing at Day 17 |
| Operational daily cost | $112M/day US-reference anchor | Kept conservative in `military.ts`; aircraft packages, munitions, attrition, and intercepts are priced in `armaments.ts` |
| `displacementMultiplier` | 0.04 (4%) | Iran: 3.2M/89M = 3.6% in 17 days |
| `gdpImpactPct` target | 15%/year | Chatham House Iran GDP forecast: -10% |
| `equipmentAttritionPct` | 8% | Kosovo 14 aircraft lost; Iran: 3 F-15EX |
| Capital flight | 7%/year | Banking freeze, oil export halt |
| Force package | `air_campaign` (already in scenario-force-packages.json) | 80 fighters, 400 cruise missiles, 5,000 precision bombs, no ground forces |

**Calibration sources:** Kosovo 1999 data; CSIS Iran 2026; Oxford Economics Iran impact analysis

### Fix 3 — Humanitarian recalibration (`humanitarian.ts`)

**Implementation:**
Added a `Direct casualties (killed & injured)` line item using the WHO human-capital VSL methodology.

**Methodology:**
- Value of Statistical Life (VSL) = GDP per capita × 100 (WHO method), minimum $200K
- Injury cost = VSL × 15% (long-term disability, trauma care, lost productivity)
- Daily casualty rates by scenario (killed per million population-at-risk per day):

| Scenario | Killed/M/day | Injured/M/day | Calibration source |
|---|---|---|---|
| `precision_strike` | 0.2 | 1.5 | Mostly military targets |
| `air_campaign` | 1.0 | 8.0 | Iran 2026: 1,444/89M/17d = 0.95/M/day |
| `skirmish` | 1.5 | 10.0 | Kargil War 1999 |
| `conventional` | 5.0 | 35.0 | Iraq 2003 invasion: ~7,000 civilians/26M/21d |
| `occupation` | 0.8 | 5.0 | Afghanistan 2003–2021 average |

**Before:** Humanitarian for USA→Iran precision_strike = $14M
**After:** $382M (dominated by casualty cost $368M; displacement only $47M)

**Why this matters:** For short, high-intensity air campaigns, casualties are the dominant humanitarian cost driver — not displacement. The original model was calibrated around multi-year refugee crises and systematically undercounted immediate strike casualties.

### Fix 4 — Economic capital flight calibration (`economic.ts`)

Added scenario-specific capital flight percentages for `precision_strike` (3%/year) and `air_campaign` (7%/year) to the existing `CAPITAL_FLIGHT_PCT` map.

**Before:** Both scenarios defaulted to 4% (catch-all)
**After:** `air_campaign` = 7% (banking freeze, oil exports halted; calibrated to Iran 2026 immediate capital controls); `precision_strike` = 3% (short duration limits flight but investor panic is real)

### Fix 5 — Air-campaign displacement share (`humanitarian.ts`)

For `air_campaign`, the humanitarian module now treats `displacementMultiplier` as a direct observed population share. Other scenarios still use the historical UNHCR ratio multiplied by the scenario dampener.

**Before:** USA→Iran air_campaign = ~293K displaced
**After:** USA→Iran air_campaign = ~3.66M displaced

---

## 7. Post-Fix Calculator Output

### `precision_strike` (18 days) — closest to real Day 17 situation

| Category | Before | After | Real (Day 13–17) |
|---|---|---|---|
| Military | $4.48B | $4.48B | — |
| Armaments | $8.50B | $8.58B (+intercepts) | — |
| **Humanitarian** | **$14M** | **$382M** | **~$2B+** |
| Reconstruction | $310M | $310M | — |
| **TOTAL** | **$13.30B** | **$13.75B** | **$14–16.5B** |

### `air_campaign` (55 days) — better scenario fit

| Category | Amount | Notes |
|---|---|---|
| Military | $9.67B | Watson anchor scaled to US budget |
| Armaments | $39.51B | Force package + munitions + intercepts |
| Humanitarian | $7.78B | Casualties + air-campaign displacement share |
| Reconstruction | $3.10B | Infrastructure repair |
| **TOTAL** | **$60.06B** | **broader than public direct-spending estimates** |
| Economic impact | $196.44B | Dominated by $180B oil/commodity shock |

The `air_campaign` scenario at 55 days produces $60.06B headline cost, of which $49.18B is military plus armaments. That military/armaments figure is slightly above Penn Wharton's $38-47B direct federal projection through April 30, while the broader headline is not directly comparable because it includes humanitarian and reconstruction costs.

### `air_campaign` (39 days) — observed campaign length

| Category | Amount | Notes |
|---|---|---|
| Military | $6.89B | Lower duration than the 55-day archetype |
| Armaments | $38.97B | Munitions and intercepts dominate |
| Humanitarian | $5.55B | 3.66M displaced, 3,571 killed, 28,569 injured |
| Reconstruction | $2.21B | Infrastructure repair |
| **TOTAL** | **$53.61B** | broader calculator headline |
| Military + armaments only | **$45.86B** | closest comparison to public U.S. budget estimates |
| Economic impact | $191.74B | within FDD's $50-300B range |

At the observed 39-day length, the model matches deaths and displacement well after the displacement fix. It remains high against likely direct federal outlays through the ceasefire, but near the high end of the two-month PWBM projection once munitions replacement and sustained air defense are included.

---

## 8. Remaining Gaps and Known Limitations

### Still underestimated: defensive intercepts

For Iran 2026 specifically, defensive intercepts were abnormally high. Iran's 700 ballistic missiles + 3,600 drones in 17 days is an unusually dense counter-fire campaign. The model's Iran-budget-scaled estimate produces ~$81M–$487M, vs the real $1.7B in the first 100 hours. The model is correct in structure but calibrated to a more typical counter-fire scenario than what Iran actually executed.

**Why not fix further:** Iran's ballistic missile stockpile is unusually large (the IRGC Missile Force is arguably the world's largest ballistic missile arsenal by number). Scaling to Iran's total military budget ($10B) underestimates this because Iran deliberately invested a disproportionate fraction of its budget in missiles. A country-specific missile inventory adjustment would improve this.

### Economic impact is the most uncertain module

The ~$180B "global commodity price shock" is driven by the oil module for Iran as a major producer. FDD's April 23 estimate puts direct economic damage to Iran at $50–300B, with a most likely estimate of about $144B. The model's 39-day economic-impact point estimate, $191.7B, sits inside that range but remains sensitive to oil-price and Strait of Hormuz assumptions.

### Humanitarian still incomplete

After Fix 5, displacement is no longer the main mismatch. The humanitarian total is still incomplete because three important cost channels are not modeled:
1. **Medical infrastructure destruction** — hospitals bombed → long-term healthcare cost for remaining population
2. **Food security shock** — agricultural supply chains disrupted → malnutrition costs months after fighting ends
3. **Psychological/mental health** — WHO estimates 1 in 5 people in conflict zones develop mental health conditions; long-term cost not captured

These are real costs that require additional data inputs (healthcare facility density, food import dependency ratio) to model credibly.

---

## 9. Methodology Observations

### What the calibration process revealed about the model

**Strength:** The operational cost module (Watson Institute anchors × budget scalar) is robust. It was the most accurate component both before and after the fixes, consistently producing results in the right order of magnitude.

**Weakness:** The model was built primarily around the cost to the *aggressor*. The cost of *being attacked back* — defensive intercepts, incoming missile damage, force protection — was entirely absent. In modern warfare between states with missile capabilities, this is a major blind spot.

**Structural observation:** Getting the right headline number for the wrong reasons (two errors cancelling) is a real risk in parametric modeling. The pre-fix model's $13.3B looked accurate against the $14–16.5B real figure, but the internal composition was wrong: humanitarian was 200× too low, force package procurement was probably too high. This would have been invisible without access to the real sub-category breakdown from CSIS.

**Lesson:** Model validation should check sub-category composition, not just headline totals. A model that gets the right answer for wrong reasons will fail on the next conflict with a different error profile.

### On scenario taxonomy

The four-scenario taxonomy (precision_strike → skirmish → conventional → occupation) was designed around conflict duration and ground force intensity. The Iran 2026 case exposed a fifth dimension: **missile exchange intensity**. Two conflicts can both be "air campaigns" but one involves 700+ ballistic missiles and 3,600 drones while another involves none. This variable is orthogonal to the existing scenario parameters and would ideally be modeled as an explicit input (target country missile capability tier) rather than baked into scenario defaults.

---

## 10. Data Sources Used

| Source | Role |
|---|---|
| CSIS — "$3.7 Billion: Estimated Cost of Epic Fury's First 100 Hours" (2026) | Primary calibration for defensive intercepts and daily cost rate |
| CSIS — "Last Rounds? Status of Key Munitions at the Iran War Ceasefire" (2026) | 39-day campaign length, target count, and munitions depletion reassessment |
| Penn Wharton Budget Model — Iran war projection (2026) | Benchmark for direct federal spending through Day 32 and two-month projection |
| HRANA — Day 39 Iran war casualty documentation (2026) | Updated death-count validation for the 39-day run |
| HRA / Airwars / CIVIC — Civilian Harm in Iran after One Month of War (2026) | Displacement and civilian-harm validation |
| FDD — Economic damage to Iran from Operation Epic Fury (2026) | Benchmark for target-country economic damage |
| Pentagon / NBC News — Senate briefing on 6-day cost ($11.3B) | Ground truth for 6-day direct cost |
| Foreign Policy — "The Economic Costs of the Iran War" (2026) | 12-13 day cost estimate ($14B) |
| RAND — Ukraine munitions requirements analysis | Daily munitions consumption rates |
| GAO-24-106649 — Ukraine Weapon Replacement Study | Attrition replacement calibration |
| Chatham House — Iran GDP impact analysis (2026) | gdpImpactPct for air_campaign |
| Oxford Economics — Iran war oil price scenarios | Economic module validation |
| Al Jazeera — Death toll and injuries tracker (Day 17) | Casualty data for humanitarian calibration |
| DoD Program Acquisition Costs FY2024 | Unit costs (Patriot PAC-3, SM-3, SM-2) |

---

## 11. Summary

The Iran 2026 calibration exercise produced five improvements that make the model more accurate for short, high-intensity air campaigns — a conflict type that was underrepresented in the original calibration data (which was built around Afghanistan and Ukraine).

The late-April headline result is more nuanced than the original March validation. A 39-day air campaign now produces $53.61B in broad calculator cost and $45.86B in military plus armaments. The latter is high against likely direct federal spending through the ceasefire, but near the high end of Penn Wharton's $38-47B two-month projection. The model's death estimate and displacement estimate now match the updated public evidence closely.

The most valuable outcome is not the improved number, but the identification of the **defensive intercept gap** as the largest structural omission in the model. Modern peer-state conflict is a two-way cost equation. Any calculator that only models what the aggressor spends attacking will systematically underestimate total war cost when the defender has significant ballistic missile and drone capabilities.

---

*This report documents model development decisions and calibration rationale. All cost figures are estimates with significant uncertainty. The conflict reporting changed materially between March 16 and April 26, 2026, so this document distinguishes early live-war validation from the later 39-day reassessment.*
