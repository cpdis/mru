// Pull the same preprocessed JSON the website uses. The training JSON is
// imported directly. The 2026 route is extracted from tracks.geojson into
// a plain JSON file by `scripts/extract-route.ts` (Webpack rejects
// `.geojson` imports without a custom loader).

import route2026 from "./generated/route2026.json";
import training from "../../site/public/data/training.json";

// 2026 race line — same one we use as the brand mark.
export const ROUTE_2026 = route2026 as [number, number][];

// Training blocks per year — the source of every chart in the video.
export const TRAINING = training.blocks as Record<
  string,
  {
    year: number;
    raceDay: string;
    blockDays: number;
    days: { date: string; dayIndex: number; tss: number }[];
    weeks: { weekIndex: number; longRunKm: number; tss: number }[];
    ctl: { dayIndex: number; ctl: number }[];
    totals: {
      tss: number;
      hrZoneMin: number[];
      runs: number;
      runKm: number;
    };
  }
>;

// Hard-coded race headline times — from the GPX preprocessor.
export const RACE_TIMES = {
  2024: "8:34",
  2025: "8:04",
  2026: "7:29",
} as const;
