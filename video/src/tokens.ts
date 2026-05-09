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
// Total duration: 34 seconds (was 30 — added breathing room to the
// information‑dense scenes).
export const DURATION = 34 * FPS;

// Scene timings, all in frames. Sum must equal DURATION.
export const SCENES = {
  hook: { from: 0, durationInFrames: 120 }, // 0–4s   (was 3s)
  times: { from: 120, durationInFrames: 150 }, // 4–9s
  hr: { from: 270, durationInFrames: 180 }, // 9–15s   (was 5s)
  zones: { from: 450, durationInFrames: 180 }, // 15–21s (was 5s)
  ctl: { from: 630, durationInFrames: 210 }, // 21–28s  (was 6s)
  headline: { from: 840, durationInFrames: 120 }, // 28–32s
  cta: { from: 960, durationInFrames: 60 }, // 32–34s
} as const;

export const FRAUNCES = '"Fraunces", "Times New Roman", serif';
export const SANS = '"Geist", system-ui, -apple-system, sans-serif';
export const MONO =
  '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';
