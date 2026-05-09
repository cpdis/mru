# Margaret River Ultra · three years of data

A data‑driven editorial site visualising three runs of the
[Margaret River Ultra Marathon](https://margaretriver.rapidascent.com.au/),
an 80 km point‑to‑point trail race from Hamelin Bay to Howard Park Wines on
Western Australia's Cape to Cape coast.

The story: same course, same average heart rate (163 bpm every year), but
sixty‑five minutes faster across three years. Where did the time go? Mostly
the back half.

| Year | Time   | Avg HR  | Avg pace |
|-----:|:-------|:--------|:---------|
| 2024 | 8h 34m | 163 bpm | 6:33 /km |
| 2025 | 8h 04m | 163 bpm | 6:07 /km |
| 2026 | 7h 29m | 163 bpm | 5:39 /km |

## Layout

```
.
├── 2024/                       # raw Garmin GPX
├── 2025/                       # raw Garmin GPX (split across two files,
│                               # because the watch was started under the
│                               # wrong workout type and restarted mid‑race)
├── 2026/                       # raw Garmin GPX/TCX/FIT
├── planning/
│   ├── planning.md             # the design brief
│   ├── notes.md                # session worklog
│   └── course_raw.json         # scraped from the rapidascent course page
└── site/                       # the Astro site
    ├── scripts/preprocess.ts   # GPX → compact JSON + simplified GeoJSON
    ├── src/
    │   ├── data/course.ts      # static course leg metadata
    │   ├── lib/data.ts         # build‑time JSON loader
    │   └── components/         # one component per section
    └── public/data/            # generated JSON (gitignored)
```

## Run it locally

```bash
cd site
pnpm install
pnpm dev          # preprocesses GPX, then starts the Astro dev server
```

`pnpm dev` and `pnpm build` both run the preprocessing step first
(`tsx scripts/preprocess.ts`), so the JSON in `site/public/data/` is always
in sync with the raw GPX without anyone needing to remember.

## Stack

- **Astro 6** + **React 19 islands** for the interactive bits.
- **MapLibre GL JS** with [OpenFreeMap](https://openfreemap.org) "liberty"
  tiles for the course map (no API key required).
- **Observable Plot** for the heart rate and elevation charts.
- **suncalc** for sunrise calculation.
- **Fraunces / Geist / Geist Mono** for type. Tabular figures everywhere
  numbers line up in columns.

## Sections

1. Hero with three‑year time progression
2. Headline stats table (finish time, pace, HR, gain, distance)
3. Course map with all three GPS tracks and aid stations
4. Per‑leg splits — bars scaled by elapsed time
5. Pace heatmap — every kilometre, every year
6. Heart rate curtain
7. Sunrise strip — where you were on the course at official sunrise
8. Ambient temperature strip
9. Elevation profile + per‑leg detail cards
10. Honest "the watch was reset at km 47.72" note for 2025
11. Footer
