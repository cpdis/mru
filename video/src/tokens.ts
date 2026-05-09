// Design tokens — mirrors the OLED dark theme on the site so the video
// matches the share image and the dark-mode page.

export const PAPER = "#000000";
export const PAPER_DEEP = "#0d0d0d";
export const INK = "#ede9dd";
export const INK_MUTED = "#8a857b";
export const RULE = "#25241f";

export const C2024 = "#e8a06f"; // ochre
export const C2025 = "#5cb1ac"; // teal
export const C2026 = "#93c285"; // forest

// Vertical Reel canvas — Instagram Reels and Stories both use 1080×1920.
export const W = 1080;
export const H = 1920;
export const FPS = 30;
// Total duration: 30 seconds.
export const DURATION = 30 * FPS;

// Scene timings, all in frames. Sum must equal DURATION.
export const SCENES = {
  hook: { from: 0, durationInFrames: 90 }, // 0–3s
  times: { from: 90, durationInFrames: 150 }, // 3–8s
  hr: { from: 240, durationInFrames: 150 }, // 8–13s
  zones: { from: 390, durationInFrames: 150 }, // 13–18s
  ctl: { from: 540, durationInFrames: 180 }, // 18–24s
  headline: { from: 720, durationInFrames: 120 }, // 24–28s
  cta: { from: 840, durationInFrames: 60 }, // 28–30s
} as const;

export const FRAUNCES = '"Fraunces", "Times New Roman", serif';
export const SANS = '"Geist", system-ui, -apple-system, sans-serif';
export const MONO =
  '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';
