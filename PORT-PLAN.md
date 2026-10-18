# Port plan: Canada Population Forecaster → browser-native web app

**Goal.** Replace the R/Shiny (golem) app with a fully client-side implementation — Svelte front end, forecast engine in JavaScript/WebAssembly, data in Parquet — hosted free on GitHub Pages with no server at all. Every visitor gets instant, private, offline-capable scenario exploration.

**UX prototype (review before committing):** https://claude.ai/artifact/4iSLZNJYE7TBjYyiSuY2cB — interactive, with illustrative numbers. Approving/amending this design is the gate for Phase 3 below.

---

## 1. What the app is today

- R package `forecasterGolem` 2.0 (golem/Shiny + bslib + plotly), deployed to shinyapps.io.
- Cohort-component model: 14 geographies (Canada + 13 prov/terr) × 36 age–sex cohorts, advanced in 5-year steps 2021→2071 via a 36×36 Leslie-style transition matrix ([fct_demography.R](forecaster_golem/R/fct_demography.R)).
- User levers: fertility %, mortality %, immigration % of population, internal-migration scenario (none/ave/cma/res), reference period (2006–11 / 2011–16 / 2016–21), plus display controls.
- Outputs: time series (7 indicators), population pyramid, SVG choropleth map, House of Commons seat reallocation ([fct_seats.R](forecaster_golem/R/fct_seats.R) — real constitutional formula incl. 2022 grandfather-clause amendment), diagnostic xlsx download.
- Data: all bundled in `R/sysdata.rda`, **~1.4 MB in memory total**. Largest tables: `dom_move` 27,808 rows, `im_flows` 7,944 rows. Everything else is tiny (3 × baseFigs lists of 14×36-row frames, 13×13 matrices, historical series).

Key fact for the architecture: **the data is small and the computation is trivial in modern JS terms.** One full 50-year scenario = 11 steps × 14 geographies × a 36×36 mat-vec ≈ 200k multiply-adds — well under a millisecond in plain JavaScript. The expensive-feeling parts of the Shiny app are R's dplyr aggregations and server round-trips, both of which disappear.

## 2. Architecture

```
┌─ GitHub Pages (static) ─────────────────────────────┐
│  SvelteKit (adapter-static, Svelte 5 runes)         │
│  ├─ UI components (controls, KPIs, charts, map)     │
│  ├─ d3-scale/shape for charts (SVG, no plotly)      │
│  └─ Web Worker ──────────────────────────────┐      │
│     │ engine.ts: cohort-component model      │      │
│     │ (Float64Array, ports fct_demography/   │      │
│     │  fct_seats 1:1)                        │      │
│     │ hyparquet: reads /data/*.parquet       │      │
│     └──────────────────────────────────────────      │
│  /data/*.parquet  (built by R export script)        │
└─────────────────────────────────────────────────────┘
```

- **SvelteKit + `adapter-static`**, `paths.base` set for project pages. Svelte 5 runes make the Shiny reactive graph port naturally: each `reactive()`/`bindCache()` in [mod_scenario.R](forecaster_golem/R/mod_scenario.R) becomes a `$derived` memo.
- **Engine in a Web Worker** so slider drags never jank the UI; debounce stays (or goes — see §3, it may be fast enough to run on every input event).
- **TypeScript throughout**; the engine is pure functions over typed arrays, which makes golden-master testing against R trivial.

## 3. Query layer assessment: what's actually fastest

Three realistic candidates for "Parquet + querying in the browser":

| | DuckDB-WASM | parquet-wasm (Rust→WASM) + Arquero | **hyparquet (pure JS) + typed-array code** |
|---|---|---|---|
| Download (gzip/brotli) | ~2.5 MB WASM + worker JS, plus extension fetches | ~1 MB WASM + ~45 KB Arquero | **~10 KB** |
| Init time | ~0.5–2 s (worker + WASM compile) | ~100–300 ms | **~0 (no WASM to instantiate)** |
| Query model | Full SQL, range-request scans, row-group skipping | Arrow tables, dataframe verbs | Plain JS over decoded columns |
| Sweet spot | 10⁶–10⁹ rows, ad-hoc analytics | 10⁵–10⁷ rows | **< 10⁵ rows, fixed query shapes** |

Our workload is **two group-by aggregations over 28k and 8k rows, re-run only when the reference period changes** (3 possible values — they can even be precomputed at build time), plus pure matrix math. At this scale the dominant cost of DuckDB-WASM is *its own download and instantiation* — it would be 100× the payload to save microseconds on queries plain JS already does in <5 ms. Benchmarks that favour DuckDB/SQLite-WASM (e.g. timlrx's browser data-processing comparison) are on ~10⁶-row datasets, 40× larger than ours.

**Recommendation: hyparquet** (pure-JS Parquet reader, zero WASM init, tree-shakes to ~10 KB) to decode the Parquet files into typed arrays at load, then hand-written JS for the two aggregations (`calcOut`, `calcFlowMat`) and the cohort engine. Total data+code payload stays under ~300 KB — the app becomes interactive faster than DuckDB-WASM would finish instantiating. "WASM where it pays": hyparquet optionally uses a tiny WASM path (`hysnappy`) for Snappy decompression; we'll write Parquet with Snappy so that applies. If a future version adds genuinely large data (e.g. census subdivisions), swap the reader for DuckDB-WASM behind the same `loadData()` interface — the plan isolates that decision in one module.

Also assessed and rejected: compiling the engine itself to WASM (Rust/AssemblyScript) — the matrices are 36×36; JIT-compiled JS on `Float64Array` is already memory-bandwidth-bound at this size, and a WASM boundary adds copy overhead and build complexity for no visible gain.

## 4. Data pipeline (R → Parquet, run once per data update)

New script `forecaster_golem/data-raw/export_parquet.R` (uses {arrow}; Snappy compression):

| Parquet file | Source object(s) | Shape |
|---|---|---|
| `base_figs.parquet` | `baseFigs_{2006_2011,2011_2016,2016_2021}` | long: ref_period × geog × cohort × sex × {pop, mort, fert, intl_immig, immig_stock} |
| `dom_move.parquet` | `dom_move` | 27,808 × 5 |
| `im_flows.parquet` | `im_flows` | 7,944 × 4 |
| `historical.parquet` | `historical_series` | long: geog × year × 6 indicators |
| `scenario_mats.parquet` | `cma_mat`, `resource_mat` | long: scenario × origin × destination × share |
| `constants.json` | `settle_cma_pct`, `baseDat` cohort order, BASE_YEAR, DEFAULT_IMMIG_PCT, EQ anchor, 2021 seats, senate floors | tiny, JSON is fine |

Also export **golden-master fixtures**: for ~6 slider combinations, dump the R model's full output (`prov_forecasts`, seats, EQs, foreign-born) to JSON; the TS engine's test suite must reproduce them exactly (integer-for-integer, since the model uses `floor`/`ceiling`).

## 5. Engine port (R → TypeScript, function-by-function)

| R (fct_demography.R / fct_seats.R) | TS module |
|---|---|
| `calcPopMortFert(FB)` | `transition.ts` — 36×36 mat-vec on Float64Array |
| `stepIntlMig`, `calcIntlMigPop/FB` | `intlMigration.ts` |
| `calcOut`, `calcFlowMat` | `flows.ts` (the only "queries"; group-by over decoded columns) |
| `calcDomMigPop`, `stepNaturalIncrease` | `domesticMigration.ts`, `naturalIncrease.ts` |
| `calcForecasts`, `makeProvForecasts` | `forecast.ts` |
| `calcEQs`, `reallocateSeats`, `calcSeats` | `seats.ts` |
| `makeItem/makeSeries/makeHistorical` (fct_plot_data.R) | `indicators.ts` |

Porting traps to preserve deliberately: `floor()`/`ceiling()` placement; the canonical cohort ordering (R's `calcOut` comment warns about alphabetical sort); the shared `ref_rate_for()` anchor so Current Trends ≡ User Scenario at defaults; mortality slider applying only to cohorts 12–18/30–36 (ages 55+).

## 6. UX design (what the prototype proposes)

Changes vs. the Shiny app, all demonstrated in the prototype:

1. **Info icons (ⓘ) everywhere** — every control, KPI, and chart gets a popover: plain-language explanation + StatCan source table. Content inventory already drafted in the prototype (fertility 13-10-0418, life tables 84-537-X, immigration 17-10-0014, settlement 17-10-0149, interprovincial 17-10-0015/0022, seat rules Constitution Act ss. 51–52 + 2022 Act).
2. **KPI strip** (population, Commons seats, dependency ratio, % foreign-born) so the headline consequences of a scenario are visible without reading charts.
3. **Quick-scenario presets** ("Aging Canada", "Century Initiative", "Closed borders", "Resource boom") — one tap to a meaningful starting point; slider positions shown so students see *what* each story assumes.
4. **Year scrubber with play button** — animate 2021→2071; pyramid and map animate, making aging visible as motion.
5. **Pin scenario** — freeze the current settings as a third line for A/B comparison (replaces mentally diffing two sessions).
6. **Tile cartogram** instead of the geographic SVG — equal-size province tiles make PEI as legible as Quebec and read instantly at phone width; modes: absolute / change since 2021 / vs. current trends.
7. **Seats strip chart** with 2021-vs-target bars per province and the grandfather-clause "can only go up" behaviour visible.
8. **Click-to-set-year on the time series**, hover tooltips everywhere, history drawn as a dashed "Actual" line.
9. **Data & methods tab** — cohort-component explainer, full source table, "a projection is not a prediction" framing (serves the Future Policy Lab teaching purpose).
10. Light + dark themes; fully keyboard-accessible popovers and map tiles; phone-width layout.

## 7. Functionality extensions (consistent with the app's purpose)

Phase-4 candidates, roughly in value order:
- **Shareable scenario URLs** (`#f=100&m=100&i=1.6&…`) — students submit/compare scenarios by link; free with a static app.
- **Scenario comparison table** — pinned vs. current vs. trends for all 7 indicators in the target year.
- **CSV/xlsx export** of the diagnostic workbook (SheetJS or zipped CSVs), replacing the openxlsx download.
- **Uncertainty framing** — show the three reference periods as a band rather than a single line (cheap: run all three).
- **Embed/presentation mode** (`?embed`) — single chart, no chrome, for slides and course pages.
- **French UI** — svelte-i18n; strings are already centralized by the port.
- Deliberately out of scope: CMA-level geography (no data dimension), probabilistic projections (different model class).

## 8. Repository & hosting

- New top-level `app/` (SvelteKit) beside `forecaster_golem/`; repo pushed to GitHub, **GitHub Pages via Actions**: build job runs `npm ci && npm run build` (optionally regenerates Parquet via R container when `data-raw` changes), uploads `build/` artifact, deploys. Shiny app stays up until parity is signed off.
- `.parquet` served with correct MIME automatically (Pages serves as octet-stream; hyparquet fetches as ArrayBuffer, no issue). Everything same-origin → no CORS.
- Budget: Lighthouse perf ≥ 95 on throttled mobile; total transfer < 500 KB.

## 9. Phases & acceptance gates

| Phase | Work | Gate | Status |
|---|---|---|---|
| 0. UX sign-off | Review the prototype; adjust | You approve the design | ✅ Oct 18, 2026 (light mode, hex cartogram, diverging ramp, slider ticks) |
| 1. Data | `export_parquet.R`, fixtures, schema doc | Parquet round-trips == sysdata values | ✅ 133 KB of Parquet + 6 fixtures |
| 2. Engine | Port + unit tests | Golden-master parity with R on all fixtures | ✅ 30/30 tests, integer-exact |
| 3. UI | SvelteKit app per approved prototype | Feature parity checklist; axe-core clean | ✅ built & browser-verified (axe pass pending) |
| 4. Extensions | §7 items as approved | Per-item | Shareable URLs + CSV export done; rest open |
| 5. Deploy | Pages workflow, README, redirect from old URL | Live URL; Lighthouse ≥ 95 | Workflow + README ready; needs GitHub repo |

**Effort estimate:** Phases 1–3 ≈ 3–5 working sessions; the engine port is the only intellectually risky part and the fixtures de-risk it.
