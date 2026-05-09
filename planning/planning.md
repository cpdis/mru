# Margaret River Ultra — 3 Year Visualization

## Goal
Single-page editorial site visualizing Colin's Margaret River Ultra Marathon
(80km) results across 2024, 2025, and 2026. Lead story: year-over-year
progression. Secondary: how the course actually unfolds (5 legs, terrain,
elevation, sunrise, temperature, heart rate).

Deploy at `mru.cpd.dev` via the `/ship` pipeline.

## The data we have

| Year | File(s)                                        | Start (UTC)        | End (UTC)          | Elapsed   | Trkpts |
|------|------------------------------------------------|--------------------|--------------------|-----------|--------|
| 2024 | `activity_15331704414.gpx`                     | 2024-05-10 22:15Z  | 2024-05-11 06:49Z  | 8h 34m    | 30,846 |
| 2025 | `activity_19077368957.gpx` + `..._19077368959` | 2025-05-09 22:16Z  | 2025-05-10 06:21Z  | 8h 05m\*  | 29,089 |
| 2026 | `activity_22815493925.gpx` (+ TCX, FIT)        | 2026-05-08 22:16Z  | 2026-05-09 05:45Z  | 7h 29m    | 26,944 |

\* 2025 was started under the wrong workout type on the watch and split into
two GPX files. We stitch them: file 1 ends at 02:46:25Z, file 2 starts at
02:46:26Z (one-second gap, no missing data). That gap roughly aligns with the
Contos / Riflebutts area based on coordinates and will be flagged in the UI as
a dotted "watch reset" tick rather than hidden.

Per-trackpoint Garmin extensions present: heart rate, ambient temperature,
cadence. 2026 also has a TCX with lap summaries and a FIT in zip (we won't
need FIT — TCX has the totals: 78,657.66 m, 26,943 s, 6,279 kcal, avg HR 163,
max HR 184).

Race start in Western Australia (UTC+8) is 06:15 local. Sunrise on Margaret
River in early-mid May is around 06:55–07:05 local — a real moment in the
viz: you start in the dark, sun comes up over leg 1.

## Course (scraped from rapidascent)

Hamelin Bay → Howard Park Wines, 80km, ~1,730m gain / ~1,675m loss.

| Leg | From → To                                      | Dist  | Cum   | Up   | Down | Terrain                                                  |
|-----|------------------------------------------------|-------|-------|------|------|----------------------------------------------------------|
| 1   | Hamelin Bay → Boranup Campsite                 | 11.5  | 11.5  | 370  | 190  | Firm base, minimal sand, climby                          |
| 2   | Boranup Campsite → Contos Campground           | 16.0  | 27.5  | 350  | 440  | Hard-packed Boranup karri forest, undulating             |
| 3   | Contos → Riflebutts Reserve (Gnarabup)         | 19.5  | 47.0  | 380  | 485  | Cape→Cape, granite rock-hopping, brutal beach finish     |
| 4   | Riflebutts → Gracetown                         | 18.5  | 65.5  | 280  | 290  | Coastal Cape→Cape, Ellensbrook, mixed sand               |
| 5   | Gracetown → Howard Park Wines                  | 13.1  | 78.5  | 250  | 150  | North Point rocks, then farm roads through vines         |

3 ITRA points / UTMB qualifier (3 pts).

## What's interesting in this data

1. **Three-year arc, real improvement**: 8:34 → 8:05 → 7:29. ~13% faster.
   Where does the time come from? Pace-per-leg comparison should make this
   immediately legible.
2. **Beach-running collapse on leg 3**: every year, leg 3's "soft angled
   sand" should dent pace and spike HR. Worth a callout.
3. **Sunrise on leg 1**: dark start, light reveals the course.
4. **Ambient temp climb through the day**: cool start, warming through legs
   3–5.
5. **HR drift**: cardiac drift in late race vs. early. Compare drift across
   years — fitter you = less drift.
6. **The 2025 watch reset**: fold the "Running 1"/"Running 2" stitch into the
   story rather than hide it.
7. **Where the GPS lines diverge**: subtle routing differences year over
   year (course tweaks).

## Architecture

```
mru-site/
├── data/                       # source GPX/TCX, untracked beyond raw refs
├── scripts/
│   └── preprocess.ts           # GPX → compact JSON + GeoJSON, runs at build
├── public/data/
│   ├── 2024.json               # per-km series + metadata
│   ├── 2025.json
│   ├── 2026.json
│   ├── tracks.geojson          # all 3 tracks, simplified, ~50–80kb
│   └── course.json             # leg boundaries, aid stations
├── src/
│   ├── pages/index.astro       # the one page, scroll-driven sections
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── HeadlineNumbers.astro
│   │   ├── CourseMap.tsx       # MapLibre island
│   │   ├── LegSplits.tsx       # per-leg comparison
│   │   ├── PaceHeatmap.tsx     # km × year matrix
│   │   ├── HrCurtain.tsx       # HR over distance, 3 lines
│   │   ├── ElevationProfile.tsx
│   │   ├── SunriseStrip.tsx    # time-of-day strip with sun moment
│   │   └── TempStrip.tsx
│   └── styles/global.css
└── astro.config.mjs
```

## Preprocessing pipeline (`scripts/preprocess.ts`)

For each year:
1. Parse GPX with `@xmldom/xmldom` + `@tmcw/togeojson` (or hand-rolled — the
   files are big; 30k+ pts).
2. Concatenate 2025's two segments. Insert a `watch_reset_at` marker.
3. Compute cumulative distance using haversine on consecutive points.
4. Resample to per-km bins:
   - `pace_s_per_km` (median of points in bin)
   - `hr_bpm` (mean)
   - `elev_m` (mean)
   - `temp_c` (mean)
   - `cadence` (mean, where > 0)
   - `wallclock_iso` (first point in bin, local AWST)
5. Snap each km to a leg using cumulative distance vs. course leg
   boundaries (11.5 / 27.5 / 47.0 / 65.5 / 78.5 km).
6. Simplify the GPS line for the map (Douglas–Peucker, target ~1500 pts/year)
   and emit a `tracks.geojson`.
7. Compute summary: total time, moving time, total gain (sum positive elev
   deltas with smoothing), avg HR, max HR, avg pace, calories (TCX only for
   2026 — back-compute from HR/time for 24/25 with caveat in the UI).

Output is small: each year's JSON ~80–150kb, geojson ~150kb total. No GPX in
the browser.

## Visual sections (top to bottom)

1. **Hero**: year-stamped title set in the display serif. Headline counter:
   `8:34 → 8:05 → 7:29`. Subhead: 80km, 5 legs, three years.
2. **Course map** (sticky, full-bleed when in view): MapLibre with a modern
   topo basemap (Stamen Terrain via stadiamaps, or Mapbox Outdoors style if
   we have a token, fallback to MapLibre Demo + Maptiler outdoor). 3 tracks,
   year colors. Aid stations as labeled circles. Scroll-driven: as you
   scroll the map zooms through each leg.
3. **Headline numbers**: big mono-numerics for total time / pace / gain /
   avg HR / max HR for each year. Diff vs previous year inline.
4. **Leg splits (the "where did the time go?" view)**: 5 horizontal bars per
   year, one per leg, sized by elapsed time. Lined up so leg breaks match.
   Hover/tap shows pace + HR for that leg.
5. **Pace heatmap**: 80 km columns × 3 year rows. Color = pace (faster =
   greener, slower = browner). The leg 3 sand dent should pop.
6. **HR curtain**: line chart, x = distance, y = HR. Three lines. Aid stations
   as tick marks. Annotated "cardiac drift" callout late race.
7. **Sunrise strip**: a horizontal time-of-day strip, dark on left, light on
   right, with a small sun icon at calculated sunrise. 3 dotted lines drop
   down to where each year was on course at sunrise.
8. **Temperature strip**: ambient temp curve per year, x = distance.
9. **Elevation profile**: full course profile, with leg dividers, terrain
   notes from rapidascent, and a marker for the steepest sustained climb.
10. **Course detail (per leg)**: 5 small cards with the rapidascent leg
    description, terrain summary, and your three years' splits.
11. **The 2025 stitch**: small honest callout noting the watch was reset
    mid-race, here's where, here's what we did about it.
12. **Footer**: source links, GitHub repo, race link.

## Visual language (modern topo, not skeuomorphic)

- **Type**: Display serif `Fraunces` (variable, free, distinctive — neither
  Inter nor Roboto). Body sans `Geist` or `Public Sans`. Numerics in
  `Geist Mono` or `JetBrains Mono`.
- **Color**: paper-white background `#F5F1E8` with a 1% noise texture. Ink
  near-black `#1A1A1A`. Year accents:
  - 2024: ochre `#C5743F`
  - 2025: teal `#2F6F6B`
  - 2026: forest `#3F5C3A`
- **Map**: muted topo (single-hue contour lines at low opacity over a flat
  paper base). Coastline + tracks rendered crisply on top. Avoid Google
  Maps default. Fonts inside the map match site type.
- **Motion**: scroll-driven map zoom (one motion piece). Counter rolling on
  hero load (one motion piece). Otherwise: no parallax, no kitsch.
- **Numerics**: mono with tabular figures so columns line up.

## Tech stack

- Astro 5 + React 19 islands
- MapLibre GL JS (free, no token) with a Maptiler outdoor style (free
  tier with API key) or self-hosted PMTiles if we want to be properly
  independent. Default to Maptiler for v1.
- Observable Plot for charts (faster than D3 for this scale)
- TypeScript everywhere
- Pre-process with `node --experimental-strip-types` or `tsx`
- Node 22.x, deploy on Vercel
- Cloudflare DNS via `/ship`

## Risks / open questions

- **Sunrise calc**: use `suncalc` (npm) with start coords. Trivial.
- **Maptiler key**: needs an env var. If we don't want to manage one, fall
  back to OSM raster + custom contour lines in MapLibre. v1: Maptiler.
- **Course KML**: the rapidascent page links a KML/GPX of the official
  course. Could use it as a "ghost" line under the actual runs. Worth
  grabbing — if scraping returns 200, layer it in. Not a v1 must-have.
- **Mobile**: full-bleed sticky map on mobile is tricky. Plan: on small
  screens the map becomes a fixed top section, charts stack normally below.
  Polish pass with the `/polish` skill before ship.

## Phases (rough)

1. Preprocessing + JSON output (small, fast feedback loop)
2. Astro scaffold, type/theme tokens, hero + headline numbers
3. Course map + leg/aid station overlay
4. Charts (leg splits → pace heatmap → HR → temp → elevation)
5. Sunrise + watch-reset callouts
6. Polish + responsive
7. Ship

Skill assists: `/ui` for the build, `/polish` after charts are in,
`/ship` for deploy.
