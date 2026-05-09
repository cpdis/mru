// Preprocess Strava + TrainingPeaks exports into a single tidy JSON for
// the /training page. Reads:
//   training/strava/export_<id>/activities.csv
//   training/trainingpeaks/*.csv
//
// Emits:
//   site/public/data/training.json
//
// One file per build. Same pattern as the race preprocessor: commit the
// output JSON so the deployed build is self-contained.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const STRAVA_DIR = join(ROOT, "training", "strava");
const TP_DIR = join(ROOT, "training", "trainingpeaks");
const OUT = join(__dirname, "..", "public", "data", "training.json");

// Block window: Jan 1 of each year through the race day.
const RACE_DAY: Record<number, string> = {
  2024: "2024-05-11",
  2025: "2025-05-10",
  2026: "2026-05-09",
};
const YEARS = [2024, 2025, 2026] as const;

// Cap individual activity distance — there's a single bogus 400 km Strava
// entry from 2024-04-07 that would distort the long-run series. The race
// itself is 78.5 km, so 100 km is a safe ceiling for training analyses.
const MAX_RUN_KM = 100;

// ---------- Strava ----------

function findStravaActivitiesCsv(): string {
  const subs = readdirSync(STRAVA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("export_"))
    .map((d) => d.name);
  if (!subs.length) throw new Error(`No export_<id> folder in ${STRAVA_DIR}`);
  return join(STRAVA_DIR, subs[0], "activities.csv");
}

type StravaRow = {
  date: Date;
  type: string;
  movingSec: number;
  distanceM: number;
  elevGainM: number;
  avgHr: number | null;
};

function loadStrava(): StravaRow[] {
  const path = findStravaActivitiesCsv();
  const raw = readFileSync(path, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const out: StravaRow[] = [];
  for (const r of rows) {
    const dateStr = r["Activity Date"];
    if (!dateStr) continue;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getTime() < Date.parse("2024-01-01")) continue;

    const type = (r["Activity Type"] ?? "").trim();
    let distM = parseFloat(r["Distance"] ?? "0") || 0;
    if (distM < 1000 && distM > 0) distM *= 1000; // km → m
    // Defensive cap on a known data outlier.
    if (type.toLowerCase().includes("run") && distM > MAX_RUN_KM * 1000) {
      distM = 0; // drop the bogus 400km run
    }

    out.push({
      date,
      type,
      movingSec: parseFloat(r["Moving Time"] ?? "0") || 0,
      distanceM: distM,
      elevGainM: parseFloat(r["Elevation Gain"] ?? "0") || 0,
      avgHr: numOrNull(r["Average Heart Rate"]),
    });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------- TrainingPeaks ----------

type TpRow = {
  date: Date;
  type: string;
  durationSec: number;
  distanceM: number;
  avgHr: number | null;
  tss: number | null;
  if_: number | null;
  // 10 zones in TP, but we only surface 1–5.
  hrZoneMin: number[];
};

function loadTP(): TpRow[] {
  const files = readdirSync(TP_DIR).filter((f) => f.endsWith(".csv"));
  const out: TpRow[] = [];
  for (const f of files) {
    const raw = readFileSync(join(TP_DIR, f), "utf8");
    const rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as Record<string, string>[];
    for (const r of rows) {
      const day = r["WorkoutDay"];
      if (!day) continue;
      const date = new Date(day + "T00:00:00Z");
      if (Number.isNaN(date.getTime())) continue;
      if (date.getTime() < Date.parse("2024-01-01")) continue;
      const hours = parseFloat(r["TimeTotalInHours"] ?? "0") || 0;
      out.push({
        date,
        type: (r["WorkoutType"] ?? "").trim(),
        durationSec: hours * 3600,
        distanceM: parseFloat(r["DistanceInMeters"] ?? "0") || 0,
        avgHr: numOrNull(r["HeartRateAverage"]),
        tss: numOrNull(r["TSS"]),
        if_: numOrNull(r["IF"]),
        hrZoneMin: Array.from({ length: 10 }, (_, i) =>
          parseFloat(r[`HRZone${i + 1}Minutes`] ?? "0") || 0
        ),
      });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function numOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

// ---------- date helpers ----------

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function inBlock(d: Date, year: number): boolean {
  const start = Date.parse(`${year}-01-01`);
  const end = Date.parse(RACE_DAY[year]) + 86400000; // inclusive of race day
  const t = d.getTime();
  return t >= start && t < end;
}

// ---------- Run ----------

type DayEntry = {
  date: string;
  dayIndex: number; // days since Jan 1 of the year
  durationSec: number;
  distanceM: number;
  tss: number;
  hrAvg: number | null;
  // count by primary sport family
  runs: number;
  rides: number;
  other: number;
};

type Block = {
  year: number;
  raceDay: string;
  blockDays: number;
  // Day-by-day series for the calendar heatmap and CTL.
  days: DayEntry[];
  // Weekly aggregates indexed 0..N-1.
  weeks: {
    weekIndex: number;
    runKm: number;
    runHours: number;
    longRunKm: number;
    rideKm: number;
    rideHours: number;
    tss: number;
  }[];
  // CTL (chronic training load, 42-day EMA of daily TSS).
  ctl: { date: string; dayIndex: number; ctl: number }[];
  // Aggregates over the whole block.
  totals: {
    runs: number;
    runKm: number;
    runHours: number;
    rides: number;
    rideKm: number;
    rideHours: number;
    otherCount: number;
    activitiesAll: number;
    movingHoursAll: number;
    distanceAllKm: number;
    tss: number;
    hrZoneMin: number[]; // length 5 (Z1..Z5)
    sportBreakdown: { type: string; count: number; hours: number }[];
  };
};

function buildBlock(
  year: number,
  strava: StravaRow[],
  tp: TpRow[]
): Block {
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const raceEndExclusive =
    new Date(RACE_DAY[year] + "T00:00:00Z").getTime() + 86400000;
  const blockDays = Math.floor(
    (raceEndExclusive - start.getTime()) / 86400000
  );

  // Filter both sources to this block.
  const sBlock = strava.filter((s) => inBlock(s.date, year));
  const tpBlock = tp.filter((t) => inBlock(t.date, year));

  // Daily map (YYYY-MM-DD → entry).
  const daily = new Map<string, DayEntry>();
  for (let i = 0; i < blockDays; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const k = dateKey(d);
    daily.set(k, {
      date: k,
      dayIndex: i,
      durationSec: 0,
      distanceM: 0,
      tss: 0,
      hrAvg: null,
      runs: 0,
      rides: 0,
      other: 0,
    });
  }

  // Strava → activity counts + movement.
  for (const s of sBlock) {
    const k = dateKey(s.date);
    const e = daily.get(k);
    if (!e) continue;
    e.durationSec += s.movingSec;
    e.distanceM += s.distanceM;
    const t = s.type.toLowerCase();
    if (t.includes("run")) e.runs += 1;
    else if (t === "ride" || t.includes("cycle") || t.includes("bike"))
      e.rides += 1;
    else e.other += 1;
  }

  // TP → daily TSS (sum) and avg HR (weighted).
  const dailyHr = new Map<string, { sum: number; n: number }>();
  for (const t of tpBlock) {
    const k = dateKey(t.date);
    const e = daily.get(k);
    if (!e) continue;
    if (t.tss !== null) e.tss += t.tss;
    if (t.avgHr !== null && t.durationSec > 0) {
      const cur = dailyHr.get(k) ?? { sum: 0, n: 0 };
      cur.sum += t.avgHr * t.durationSec;
      cur.n += t.durationSec;
      dailyHr.set(k, cur);
    }
  }
  for (const [k, v] of dailyHr.entries()) {
    const e = daily.get(k);
    if (e && v.n > 0) e.hrAvg = Math.round(v.sum / v.n);
  }

  const days: DayEntry[] = Array.from(daily.values()).sort(
    (a, b) => a.dayIndex - b.dayIndex
  );

  // CTL: exponential moving average with 42-day time constant.
  const ctl: { date: string; dayIndex: number; ctl: number }[] = [];
  let cur = 0;
  const tau = 42;
  for (const d of days) {
    cur = cur + (d.tss - cur) / tau;
    ctl.push({ date: d.date, dayIndex: d.dayIndex, ctl: +cur.toFixed(2) });
  }

  // Weekly aggregates. Week 0 = first 7 days from Jan 1.
  const totalWeeks = Math.ceil(blockDays / 7);
  const weeks = Array.from({ length: totalWeeks }, (_, w) => ({
    weekIndex: w,
    runKm: 0,
    runHours: 0,
    longRunKm: 0,
    rideKm: 0,
    rideHours: 0,
    tss: 0,
  }));
  for (const s of sBlock) {
    const w = Math.floor(daysBetween(start, s.date) / 7);
    if (w < 0 || w >= weeks.length) continue;
    const t = s.type.toLowerCase();
    const km = s.distanceM / 1000;
    const hr = s.movingSec / 3600;
    if (t.includes("run")) {
      weeks[w].runKm += km;
      weeks[w].runHours += hr;
      if (km > weeks[w].longRunKm) weeks[w].longRunKm = km;
    } else if (t === "ride" || t.includes("cycle") || t.includes("bike")) {
      weeks[w].rideKm += km;
      weeks[w].rideHours += hr;
    }
  }
  for (const tp of tpBlock) {
    const w = Math.floor(daysBetween(start, tp.date) / 7);
    if (w < 0 || w >= weeks.length) continue;
    if (tp.tss !== null) weeks[w].tss += tp.tss;
  }

  // Round weekly numbers for compactness.
  for (const w of weeks) {
    w.runKm = +w.runKm.toFixed(1);
    w.runHours = +w.runHours.toFixed(2);
    w.longRunKm = +w.longRunKm.toFixed(1);
    w.rideKm = +w.rideKm.toFixed(1);
    w.rideHours = +w.rideHours.toFixed(2);
    w.tss = +w.tss.toFixed(0);
  }

  // Block totals.
  const sBlockRuns = sBlock.filter((s) =>
    s.type.toLowerCase().includes("run")
  );
  const sBlockRides = sBlock.filter((s) => {
    const t = s.type.toLowerCase();
    return t === "ride" || t.includes("cycle") || t.includes("bike");
  });
  const sBlockOther = sBlock.filter((s) => {
    const t = s.type.toLowerCase();
    return !(
      t.includes("run") ||
      t === "ride" ||
      t.includes("cycle") ||
      t.includes("bike")
    );
  });

  const hrZoneMin = [0, 0, 0, 0, 0];
  for (const t of tpBlock) {
    for (let i = 0; i < 5; i++) hrZoneMin[i] += t.hrZoneMin[i] ?? 0;
  }

  // Sport breakdown table for the bar chart.
  const sportMap = new Map<string, { count: number; hours: number }>();
  for (const s of sBlock) {
    const k = s.type || "Other";
    const cur = sportMap.get(k) ?? { count: 0, hours: 0 };
    cur.count += 1;
    cur.hours += s.movingSec / 3600;
    sportMap.set(k, cur);
  }

  const totals = {
    runs: sBlockRuns.length,
    runKm: +(sBlockRuns.reduce((a, b) => a + b.distanceM, 0) / 1000).toFixed(1),
    runHours: +(sBlockRuns.reduce((a, b) => a + b.movingSec, 0) / 3600).toFixed(
      1
    ),
    rides: sBlockRides.length,
    rideKm: +(
      sBlockRides.reduce((a, b) => a + b.distanceM, 0) / 1000
    ).toFixed(1),
    rideHours: +(
      sBlockRides.reduce((a, b) => a + b.movingSec, 0) / 3600
    ).toFixed(1),
    otherCount: sBlockOther.length,
    activitiesAll: sBlock.length,
    movingHoursAll: +(
      sBlock.reduce((a, b) => a + b.movingSec, 0) / 3600
    ).toFixed(1),
    distanceAllKm: +(
      sBlock.reduce((a, b) => a + b.distanceM, 0) / 1000
    ).toFixed(1),
    tss: Math.round(tpBlock.reduce((a, b) => a + (b.tss ?? 0), 0)),
    hrZoneMin: hrZoneMin.map((m) => Math.round(m)),
    sportBreakdown: Array.from(sportMap.entries())
      .map(([type, v]) => ({
        type,
        count: v.count,
        hours: +v.hours.toFixed(1),
      }))
      .sort((a, b) => b.hours - a.hours),
  };

  return {
    year,
    raceDay: RACE_DAY[year],
    blockDays,
    days: days.map((d) => ({
      ...d,
      durationSec: Math.round(d.durationSec),
      distanceM: Math.round(d.distanceM),
      tss: +d.tss.toFixed(1),
    })),
    weeks,
    ctl,
    totals,
  };
}

// ---------- run ----------

const strava = loadStrava();
const tp = loadTP();
console.log(`Loaded: ${strava.length} Strava, ${tp.length} TP rows`);

const blocks = YEARS.map((y) => buildBlock(y, strava, tp));

const out = {
  generatedAt: new Date().toISOString(),
  blocks: Object.fromEntries(blocks.map((b) => [b.year, b])),
};

writeFileSync(OUT, JSON.stringify(out));
const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(`Wrote ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);

for (const b of blocks) {
  console.log(
    `  ${b.year}: ${b.totals.runs} runs (${b.totals.runKm} km), ` +
      `${b.totals.rides} rides, TSS ${b.totals.tss}, ` +
      `Z1..5 ${b.totals.hrZoneMin.join("/")}`
  );
}
