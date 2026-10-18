# Canada Population Forecaster

A cohort-component population forecaster for Canada and its provinces, 2021–2071:
fertility, mortality, international immigration, interprovincial migration, and
House of Commons seat reallocation under the real constitutional formula.

Version 3.0 runs **entirely in the browser** — a SvelteKit static site with the
model ported to TypeScript and the data shipped as Parquet (~130 KB). No server.

## Repository layout

| Path | What it is |
|---|---|
| `app/` | The web app (SvelteKit + TypeScript). `npm run dev` to develop, `npm test` for the parity suite, `npm run build` for the static site. |
| `app/src/lib/engine/` | The forecast engine — a line-faithful port of the R model, verified integer-for-integer against R fixtures (`engine.test.ts`). |
| `app/static/data/` | Model inputs as Parquet + `constants.json`, generated from the R package. |
| `forecaster_golem/` | The original R/Shiny (golem) implementation — its own repository ([zacktayloruwo/forecasterGolem](https://github.com/zacktayloruwo/forecasterGolem)), kept beside this one locally and git-ignored here. Still the source of truth for data preparation. |
| `forecaster_golem/data-raw/export_parquet.R` | Regenerates `app/static/data/` and the parity fixtures from `R/sysdata.rda`. Run it after any data update, then `npm test`. |
| `PORT-PLAN.md` | The porting plan and architecture decisions. |

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml` (tests must pass first). For a project page the
site is served from `/<repo-name>`, handled by the `BASE_PATH` env var.

## Updating the data

1. Edit/rerun the scripts in `forecaster_golem/data-raw/` as before.
2. `Rscript forecaster_golem/data-raw/export_parquet.R`
3. `cd app && npm test` — the parity suite confirms the engine still matches R.
4. Commit and push.

© Zack Taylor and Dave Armstrong, University of Western Ontario.
