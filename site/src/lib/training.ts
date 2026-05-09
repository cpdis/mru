// Build‑time loader for the preprocessed training data.

import data from "../../public/data/training.json";

export type DayEntry = {
  date: string;
  dayIndex: number;
  durationSec: number;
  distanceM: number;
  tss: number;
  hrAvg: number | null;
  runs: number;
  rides: number;
  other: number;
};

export type WeekAgg = {
  weekIndex: number;
  runKm: number;
  runHours: number;
  longRunKm: number;
  rideKm: number;
  rideHours: number;
  tss: number;
};

export type Block = {
  year: number;
  raceDay: string;
  blockDays: number;
  days: DayEntry[];
  weeks: WeekAgg[];
  ctl: { date: string; dayIndex: number; ctl: number }[];
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
    hrZoneMin: number[];
    sportBreakdown: { type: string; count: number; hours: number }[];
  };
};

export const TRAINING_YEARS = [2024, 2025, 2026] as const;
export type TrainingYear = (typeof TRAINING_YEARS)[number];

export const TRAINING: Record<TrainingYear, Block> = {
  2024: data.blocks["2024"] as Block,
  2025: data.blocks["2025"] as Block,
  2026: data.blocks["2026"] as Block,
};
