// Build‑time data loader. The preprocessing script writes per‑year JSON to
// public/data, and we import those files directly so Vite inlines them into
// the prerender bundle.

import data2024 from "../../public/data/2024.json";
import data2025 from "../../public/data/2025.json";
import data2026 from "../../public/data/2026.json";

export type LegSummary = {
  index: number;
  elapsedSec: number;
  distanceM: number;
  avgHr: number | null;
  avgPaceSecPerKm: number;
  gainM: number;
  lossM: number;
};

export type KmBin = {
  km: number;
  pace_s_per_km: number;
  hr: number | null;
  ele: number;
  temp: number | null;
  cadence: number | null;
  wallclock_iso: string;
  legIndex: number;
};

export type YearData = {
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
  legs: LegSummary[];
  aidStations: { name: string; km: number; lat: number; lon: number }[];
};

export const YEARS = [2024, 2025, 2026] as const;
export type Year = (typeof YEARS)[number];

export const RUNS: Record<Year, YearData> = {
  2024: data2024 as YearData,
  2025: data2025 as YearData,
  2026: data2026 as YearData,
};
