// Preprocess Garmin GPX exports into compact JSON + GeoJSON for the browser.
//
// Reads each year's GPX(s) from ../../<year>/, computes per‑km metrics,
// snaps km bins to course legs, and emits:
//   public/data/<year>.json    — summary + per‑km series
//   public/data/tracks.geojson — simplified GPS lines for the map
//
// The 2025 run is stitched from two files because the watch was started
// under the wrong workout type. The stitch point is recorded so the UI can
// honestly mark it.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LEGS } from "../src/data/course.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(__dirname, "..", "public", "data");

type Pt = {
  lat: number;
  lon: number;
  ele: number;
  t: number; // unix seconds
  hr?: number;
  cad?: number;
  temp?: number;
};

type YearInputs = {
  year: number;
  gpx: string[]; // file paths in order
  watchResetAt?: number; // index in stitched array, optional flag for UI
};

const INPUTS: YearInputs[] = [
  { year: 2024, gpx: [join(ROOT, "2024", "activity_15331704414.gpx")] },
  {
    year: 2025,
    gpx: [
      join(ROOT, "2025", "activity_19077368957.gpx"),
      join(ROOT, "2025", "activity_19077368959.gpx"),
    ],
  },
  { year: 2026, gpx: [join(ROOT, "2026", "activity_22815493925.gpx")] },
];

const YEAR_COLOR: Record<number, string> = {
  2024: "#C5743F", // ochre
  2025: "#2F6F6B", // teal
  2026: "#3F5C3A", // forest
};

// ---------- GPX parsing (regex‑based — these are well‑formed Garmin files) ----------

function parseGpx(xml: string): Pt[] {
  const pts: Pt[] = [];
  // Each <trkpt> block. Garmin emits attributes lat/lon then <ele>, <time>,
  // and an extensions block with hr/cad/atemp.
  const trkptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/trkpt>/g;
  let m: RegExpExecArray | null;
  while ((m = trkptRe.exec(xml)) !== null) {
    const lat = parseFloat(m[1]);
    const lon = parseFloat(m[2]);
    const inner = m[3];
    const ele = matchFloat(inner, /<ele>([^<]+)<\/ele>/);
    const time = inner.match(/<time>([^<]+)<\/time>/)?.[1];
    if (!time || Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const t = Math.round(new Date(time).getTime() / 1000);
    const hr = matchFloat(inner, /<ns3:hr>([^<]+)<\/ns3:hr>/);
    const cad = matchFloat(inner, /<ns3:cad>([^<]+)<\/ns3:cad>/);
    const temp = matchFloat(inner, /<ns3:atemp>([^<]+)<\/ns3:atemp>/);
    pts.push({
      lat,
      lon,
      ele: ele ?? 0,
      t,
      hr: hr ?? undefined,
      cad: cad ?? undefined,
      temp: temp ?? undefined,
    });
  }
  return pts;
}

function matchFloat(s: string, re: RegExp): number | undefined {
  const m = s.match(re);
  if (!m) return undefined;
  const v = parseFloat(m[1]);
  return Number.isNaN(v) ? undefined : v;
}

// ---------- geo helpers ----------

const R = 6371000; // earth radius in metres
function haversine(a: Pt, b: Pt): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const dφ = ((b.lat - a.lat) * Math.PI) / 180;
  const dλ = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// Douglas–Peucker line simplification on lat/lon (good enough at this scale).
function simplify(pts: Pt[], tolerance: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  const sqTol = tolerance * tolerance;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpSqDist(pts[i], pts[s], pts[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx > -1 && maxD > sqTol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

function perpSqDist(p: Pt, a: Pt, b: Pt): number {
  // Project on lat/lon plane scaled by cos(lat). Fine for short segments.
  const cosLat = Math.cos((a.lat * Math.PI) / 180);
  const ax = a.lon * cosLat,
    ay = a.lat;
  const bx = b.lon * cosLat,
    by = b.lat;
  const px = p.lon * cosLat,
    py = p.lat;
  const dx = bx - ax,
    dy = by - ay;
  if (dx === 0 && dy === 0) {
    const ex = px - ax,
      ey = py - ay;
    return ex * ex + ey * ey;
  }
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const tc = Math.max(0, Math.min(1, t));
  const cx = ax + tc * dx,
    cy = ay + tc * dy;
  const ex = px - cx,
    ey = py - cy;
  // Convert back to metres for tolerance to be metres.
  const mx = ex * 111320;
  const my = ey * 110540;
  return mx * mx + my * my;
}

// ---------- main ----------

type KmBin = {
  km: number;
  pace_s_per_km: number;
  hr: number | null;
  ele: number;
  temp: number | null;
  cadence: number | null;
  wallclock_iso: string;
  legIndex: number;
};

type YearOutput = {
  year: number;
  color: string;
  startIso: string;
  endIso: string;
  elapsedSec: number;
  totalDistanceM: number;
  totalGainM: number;
  totalLossM: number;
  avgHr: number | null;
  maxHr: number | null;
  avgPaceSecPerKm: number;
  watchReset?: { km: number; isoUtc: string };
  km: KmBin[];
  legs: {
    index: number;
    elapsedSec: number;
    distanceM: number;
    avgHr: number | null;
    avgPaceSecPerKm: number;
    gainM: number;
    lossM: number;
  }[];
};

function processYear(input: YearInputs): { summary: YearOutput; line: Pt[] } {
  // 1. Parse and stitch.
  const segments = input.gpx.map((p) => parseGpx(readFileSync(p, "utf8")));
  const stitched: Pt[] = [];
  let stitchKmMarker: number | null = null;
  let stitchUtc: string | null = null;
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) {
      // Mark where the second file begins.
      stitchKmMarker = currentDistanceM(stitched) / 1000;
      stitchUtc = new Date(segments[i][0].t * 1000).toISOString();
    }
    stitched.push(...segments[i]);
  }

  // 2. Cumulative distance.
  const cum = new Float64Array(stitched.length);
  for (let i = 1; i < stitched.length; i++) {
    cum[i] = cum[i - 1] + haversine(stitched[i - 1], stitched[i]);
  }
  const totalDistanceM = cum[cum.length - 1];

  // 3. Smoothed elevation gain/loss.
  const smoothEle = smoothing(stitched.map((p) => p.ele), 30);
  let gain = 0,
    loss = 0;
  for (let i = 1; i < smoothEle.length; i++) {
    const d = smoothEle[i] - smoothEle[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }

  // 4. Per‑km bins.
  const lastKm = Math.floor(totalDistanceM / 1000);
  const km: KmBin[] = [];
  let cursor = 0;
  for (let k = 1; k <= lastKm; k++) {
    const kmMeters = k * 1000;
    // Find indices for this bin.
    while (cursor < stitched.length - 1 && cum[cursor] < kmMeters - 1000)
      cursor++;
    const start = cursor;
    let end = start;
    while (end < stitched.length - 1 && cum[end] < kmMeters) end++;
    if (end <= start) continue;
    const bin = stitched.slice(start, end + 1);
    const dur = bin[bin.length - 1].t - bin[0].t;
    const pace = dur > 0 ? dur : 0; // 1 km bin → seconds per km
    const hrs = bin.map((p) => p.hr).filter((v): v is number => !!v);
    const temps = bin.map((p) => p.temp).filter((v): v is number => v !== undefined);
    const cads = bin
      .map((p) => p.cad)
      .filter((v): v is number => v !== undefined && v > 0);
    km.push({
      km: k,
      pace_s_per_km: pace,
      hr: hrs.length ? Math.round(mean(hrs)) : null,
      ele: Math.round(smoothEle[end]),
      temp: temps.length ? +mean(temps).toFixed(1) : null,
      cadence: cads.length ? Math.round(mean(cads)) : null,
      wallclock_iso: new Date(bin[0].t * 1000).toISOString(),
      legIndex: legIndexFor(k),
    });
  }

  // 5. Per‑leg roll‑up. Walk all points, attribute by cumulative distance.
  const legAcc = LEGS.map((l) => ({
    index: l.index,
    startKm: l.index === 1 ? 0 : LEGS[l.index - 2].cumulativeKm,
    endKm: l.cumulativeKm,
    durSec: 0,
    distM: 0,
    hrs: [] as number[],
    gain: 0,
    loss: 0,
  }));
  for (let i = 1; i < stitched.length; i++) {
    const km1 = cum[i - 1] / 1000;
    const li = legAcc.findIndex((l) => km1 >= l.startKm && km1 < l.endKm);
    if (li < 0) continue;
    const dt = stitched[i].t - stitched[i - 1].t;
    const dd = cum[i] - cum[i - 1];
    legAcc[li].durSec += dt;
    legAcc[li].distM += dd;
    if (stitched[i].hr) legAcc[li].hrs.push(stitched[i].hr!);
    const dEle = smoothEle[i] - smoothEle[i - 1];
    if (dEle > 0) legAcc[li].gain += dEle;
    else legAcc[li].loss -= dEle;
  }

  // 6. Summary HR.
  const allHr = stitched.map((p) => p.hr).filter((v): v is number => !!v);
  const avgHr = allHr.length ? Math.round(mean(allHr)) : null;
  const maxHr = allHr.length ? Math.max(...allHr) : null;

  const startSec = stitched[0].t;
  const endSec = stitched[stitched.length - 1].t;
  const elapsed = endSec - startSec;

  const summary: YearOutput = {
    year: input.year,
    color: YEAR_COLOR[input.year],
    startIso: new Date(startSec * 1000).toISOString(),
    endIso: new Date(endSec * 1000).toISOString(),
    elapsedSec: elapsed,
    totalDistanceM: Math.round(totalDistanceM),
    totalGainM: Math.round(gain),
    totalLossM: Math.round(loss),
    avgHr,
    maxHr,
    avgPaceSecPerKm: Math.round(elapsed / (totalDistanceM / 1000)),
    watchReset:
      stitchKmMarker !== null && stitchUtc
        ? { km: +stitchKmMarker.toFixed(2), isoUtc: stitchUtc }
        : undefined,
    km,
    legs: legAcc.map((l) => ({
      index: l.index,
      elapsedSec: l.durSec,
      distanceM: Math.round(l.distM),
      avgHr: l.hrs.length ? Math.round(mean(l.hrs)) : null,
      avgPaceSecPerKm:
        l.distM > 0 ? Math.round(l.durSec / (l.distM / 1000)) : 0,
      gainM: Math.round(l.gain),
      lossM: Math.round(l.loss),
    })),
  };

  // 7. Simplified line for the map (~5m tolerance keeps shape, drops to ~1500 pts).
  const line = simplify(stitched, 5);
  return { summary, line };
}

function currentDistanceM(pts: Pt[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
  return d;
}

function smoothing(arr: number[], window: number): number[] {
  const out = new Array(arr.length).fill(0);
  const half = Math.floor(window / 2);
  for (let i = 0; i < arr.length; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(arr.length - 1, i + half);
    let s = 0;
    for (let j = lo; j <= hi; j++) s += arr[j];
    out[i] = s / (hi - lo + 1);
  }
  return out;
}

function mean(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function legIndexFor(km: number): number {
  for (const l of LEGS) {
    if (km <= l.cumulativeKm) return l.index;
  }
  return LEGS.length;
}

// ---------- run ----------

const features: any[] = [];
for (const input of INPUTS) {
  for (const f of input.gpx) {
    if (!existsSync(f)) {
      console.error("Missing", f);
      process.exit(1);
    }
  }
  console.log(`Processing ${input.year}...`);
  const { summary, line } = processYear(input);
  writeFileSync(
    join(OUT, `${input.year}.json`),
    JSON.stringify(summary, null, 0)
  );
  features.push({
    type: "Feature",
    properties: { year: input.year, color: summary.color },
    geometry: {
      type: "LineString",
      coordinates: line.map((p) => [+p.lon.toFixed(6), +p.lat.toFixed(6)]),
    },
  });
  console.log(
    `  ${input.year}: ${(summary.totalDistanceM / 1000).toFixed(2)} km, ` +
      `${fmtTime(summary.elapsedSec)}, ${summary.km.length} km bins, ` +
      `${line.length} simplified pts`
  );
}

writeFileSync(
  join(OUT, "tracks.geojson"),
  JSON.stringify({ type: "FeatureCollection", features })
);

console.log("Wrote outputs to", OUT);

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
