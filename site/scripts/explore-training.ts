// Exploratory pass over the training data. Reads Strava + TP exports and
// prints summary stats across the three race years so we can decide what
// the actual story is before building any chart.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const STRAVA_DIR = join(ROOT, "training", "strava");
const TP_DIR = join(ROOT, "training", "trainingpeaks");

// Race days in UTC (we know these from the GPX preprocessing).
const RACE_DAY: Record<number, string> = {
  2024: "2024-05-11", // 22:15Z = 06:15 AWST 2024-05-11
  2025: "2025-05-10",
  2026: "2026-05-09",
};

// ---------- Strava ----------

function findStravaActivitiesCsv(): string {
  // Strava bulk export expands into a folder named export_<id>/.
  const subs = readdirSync(STRAVA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("export_"))
    .map((d) => d.name);
  if (!subs.length) throw new Error(`No export_<id> folder in ${STRAVA_DIR}`);
  return join(STRAVA_DIR, subs[0], "activities.csv");
}

type StravaRow = {
  date: Date;
  type: string;
  name: string;
  movingSec: number;
  distanceM: number;
  elevGainM: number;
  avgHr: number | null;
  maxHr: number | null;
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
    // Strava's format e.g. "Jan 1, 2024, 6:30:00 AM"
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getTime() < Date.parse("2024-01-01")) continue;
    out.push({
      date,
      type: r["Activity Type"] ?? "",
      name: r["Activity Name"] ?? "",
      movingSec: parseFloat(r["Moving Time"] ?? "0") || 0,
      // Strava's "Distance" is duplicated; take the column that's metres.
      // Heuristic: the second "Distance" column on the row is metres.
      distanceM: pickDistanceMeters(r),
      elevGainM: parseFloat(r["Elevation Gain"] ?? "0") || 0,
      avgHr: numOrNull(r["Average Heart Rate"]),
      maxHr: numOrNull(r["Max Heart Rate"]),
    });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function pickDistanceMeters(r: Record<string, string>): number {
  // Strava's bulk CSV has two "Distance" columns; the first is in km
  // (display), the second is the canonical metres. csv-parse will keep
  // the last one when columns share names.
  const v = parseFloat(r["Distance"] ?? "0");
  if (!Number.isFinite(v)) return 0;
  // If it's < 1000 it's almost certainly km — convert.
  return v < 1000 ? v * 1000 : v;
}

function numOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

// ---------- TrainingPeaks ----------

type TpRow = {
  date: Date;
  type: string;
  durationSec: number;
  distanceM: number;
  avgHr: number | null;
  maxHr: number | null;
  tss: number | null;
  if_: number | null;
  // HR zone minutes (TP uses 10 zones; most users only see 1–5).
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
        type: r["WorkoutType"] ?? "",
        durationSec: hours * 3600,
        distanceM: parseFloat(r["DistanceInMeters"] ?? "0") || 0,
        avgHr: numOrNull(r["HeartRateAverage"]),
        maxHr: numOrNull(r["HeartRateMax"]),
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

// ---------- Analysis helpers ----------

function inJanToRace(d: Date, year: number): boolean {
  const start = Date.parse(`${year}-01-01`);
  const end = Date.parse(RACE_DAY[year]);
  const t = d.getTime();
  return t >= start && t <= end;
}

function fmtHrs(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function fmtKm(m: number): string {
  return (m / 1000).toFixed(1);
}

function weekOf(d: Date, blockStart: Date): number {
  // Returns 0-indexed week within the Jan→race block.
  const days = Math.floor((d.getTime() - blockStart.getTime()) / 86400000);
  return Math.floor(days / 7);
}

// ---------- Run ----------

const strava = loadStrava();
const tp = loadTP();

console.log(
  `\n=== Loaded: ${strava.length} Strava activities, ${tp.length} TP workouts ===`
);

for (const year of [2024, 2025, 2026]) {
  const blockStart = new Date(`${year}-01-01T00:00:00Z`);
  const sBlock = strava.filter((s) => inJanToRace(s.date, year));
  const tpBlock = tp.filter((t) => inJanToRace(t.date, year));

  console.log(`\n────── ${year} · Jan 1 → ${RACE_DAY[year]} ──────`);

  // Type breakdown (Strava — broader sport coverage)
  const typeCounts = new Map<string, number>();
  for (const s of sBlock) {
    typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
  }
  console.log(
    "Strava activity types:",
    Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}:${v}`)
      .join(" ")
  );

  // Run-only stats
  const runs = sBlock.filter(
    (s) => s.type === "Run" || s.type === "TrailRun" || s.type === "Trail Run"
  );
  console.log(
    `Runs: ${runs.length} · ${fmtKm(
      runs.reduce((a, b) => a + b.distanceM, 0)
    )} km · ${fmtHrs(runs.reduce((a, b) => a + b.movingSec, 0))}`
  );

  // Total Strava activities + total movement time
  console.log(
    `All activities: ${sBlock.length} · ${fmtHrs(
      sBlock.reduce((a, b) => a + b.movingSec, 0)
    )} total moving · ${fmtKm(
      sBlock.reduce((a, b) => a + b.distanceM, 0)
    )} km total`
  );

  // Long-run progression (max run distance per week, only run types)
  const weeklyLongRun = new Map<number, number>();
  for (const r of runs) {
    const w = weekOf(r.date, blockStart);
    weeklyLongRun.set(w, Math.max(weeklyLongRun.get(w) ?? 0, r.distanceM));
  }
  const totalWeeks = Math.ceil(
    (Date.parse(RACE_DAY[year]) - blockStart.getTime()) / (7 * 86400000)
  );
  console.log(`Weekly longest run (km), week 0..${totalWeeks - 1}:`);
  const lr: string[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const m = weeklyLongRun.get(w) ?? 0;
    lr.push(m > 0 ? (m / 1000).toFixed(0).padStart(3) : "  -");
  }
  console.log("  " + lr.join(" "));

  // Weekly run volume (km)
  const weeklyKm = new Map<number, number>();
  for (const r of runs) {
    const w = weekOf(r.date, blockStart);
    weeklyKm.set(w, (weeklyKm.get(w) ?? 0) + r.distanceM);
  }
  console.log(`Weekly run volume (km):`);
  const wv: string[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const km = (weeklyKm.get(w) ?? 0) / 1000;
    wv.push(km > 0 ? km.toFixed(0).padStart(3) : "  -");
  }
  console.log("  " + wv.join(" "));

  // TP TSS per week (where available)
  if (tpBlock.length) {
    const weeklyTss = new Map<number, number>();
    for (const t of tpBlock) {
      if (t.tss === null) continue;
      const w = weekOf(t.date, blockStart);
      weeklyTss.set(w, (weeklyTss.get(w) ?? 0) + t.tss);
    }
    console.log(`Weekly TSS (TP):`);
    const tss: string[] = [];
    for (let w = 0; w < totalWeeks; w++) {
      const t = weeklyTss.get(w) ?? 0;
      tss.push(t > 0 ? Math.round(t).toString().padStart(4) : "   -");
    }
    console.log("  " + tss.join(" "));
    const totalTss = Array.from(weeklyTss.values()).reduce((a, b) => a + b, 0);
    console.log(`Total TSS in block: ${Math.round(totalTss)}`);
  } else {
    console.log("No TP data for this block.");
  }

  // Aggregate TP HR-zone time (zones 1-5)
  if (tpBlock.length) {
    const zones = [0, 0, 0, 0, 0];
    for (const t of tpBlock) {
      for (let i = 0; i < 5; i++) zones[i] += t.hrZoneMin[i] ?? 0;
    }
    console.log(
      "TP HR zone minutes (Z1..Z5):",
      zones.map((z) => Math.round(z)).join(" / ")
    );
  }
}

console.log();
