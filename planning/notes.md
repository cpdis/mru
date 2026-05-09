# MRU site — worklog

## 2026-05-09 — Planning kickoff

- Inventoried source data:
  - 2024: 1 GPX, 30,846 pts, 8h34m
  - 2025: 2 GPX (watch was started under wrong workout type, restart at
    02:46:25–02:46:26Z, 1s gap, no data loss). Combined 8h05m
  - 2026: GPX + TCX + FIT (zip). 7h29m, 78.66km per TCX, 6279 kcal, avg HR
    163, max 184
- Garmin extensions per trackpoint: HR, ambient temp, cadence
- Scraped rapidascent course page via Playwright (WebFetch was 403). Saved
  raw text to `planning/course_raw.json`. 5 legs, 80km, 1,730m gain
- Decisions (Q&A with Colin):
  - Stack: Astro + React islands
  - Course data: scraped via agent-browser/playwright (done)
  - Narrative: three-year progression
  - Visual: modern topographic / cartographic, not skeuomorphic
- Wrote `planning/planning.md` with full architecture, sections,
  preprocessing plan, visual language

## 2026-05-09 — Build

- `git init` at repo root, site code in `site/` subfolder
- Astro 6 + React 19 + MapLibre GL + Observable Plot + suncalc installed
- `scripts/preprocess.ts` parses GPX, stitches 2025 halves at km 47.72,
  computes per‑km bins (pace/HR/temp/elev/cadence), aggregates per‑leg
  rollups, and emits ~11 KB JSON per year + 83 KB combined GeoJSON
- Build script chains preprocess automatically: `pnpm dev` and `pnpm build`
  always have fresh data
- All sections built and rendering. Story comes through visually:
  - Average HR is identical 163 bpm every year
  - 2024 leg 4: 2h15m, leg 5: 1h49m. 2026 leg 4: 1h55m, leg 5: 1h18m
  - Pace heatmap shows 2024's red zone in legs 3‑5 collapsing to green/gold
    in 2026
  - HR curtain shows 2024 (ochre) crashing into 140s late race; 2026 holds
    160s
- Map: switched to OpenFreeMap "liberty" style for richer cartographic feel
- HR end labels were stacking; moved to anchor near km 60 with white halo

### State
Site building, dev server live at 4321, all sections renders cleanly on
desktop and mobile.

### Next
1. `git commit` initial site
2. `/ship` to GitHub + Vercel + Cloudflare DNS at `mru.cpd.dev`

### Blockers
None.
