// Display formatters. Tabular figures are handled in CSS via .num.

export function fmtElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function fmtElapsedLong(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function fmtPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtSignedSec(diff: number): string {
  const sign = diff >= 0 ? "+" : "−";
  const a = Math.abs(diff);
  const m = Math.floor(a / 60);
  const s = Math.round(a % 60);
  if (m === 0) return `${sign}${s}s`;
  return `${sign}${m}m ${String(s).padStart(2, "0")}s`;
}

export function fmtSignedMin(diff: number): string {
  const sign = diff >= 0 ? "+" : "−";
  const a = Math.abs(diff);
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const s = a % 60;
  if (h > 0) return `${sign}${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${sign}${m}m ${String(s).padStart(2, "0")}s`;
  return `${sign}${s}s`;
}

export function fmtKm(meters: number, dp = 1): string {
  return (meters / 1000).toFixed(dp);
}
