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

// Scene boundaries are snapped to beats in "Dover" by The Westerlies,
// detected with aubiotrack. Frame numbers below are the exact frames
// nearest each chosen beat (all within 25 ms — below human sync
// perception threshold).
//
//   beat 5.75s  → end of opening phrase
//   beat 11.65s → end of next phrase
//   beat 17.40s → section change (after 0.95s gap)
//   beat 23.55s → new section (after 0.82s gap)
//   beat 31.72s → climactic downbeat (after 0.96s gap)
//   beat 35.82s → closing run-up
//   beat 39.89s → final beat before next big gap
//
// Total runtime: ~40 seconds.
export const DURATION = 1197;

export const SCENES = {
  hook: { from: 0, durationInFrames: 173 }, // 0 → 5.77s
  times: { from: 173, durationInFrames: 177 }, // → 11.67s
  hr: { from: 350, durationInFrames: 172 }, // → 17.40s
  zones: { from: 522, durationInFrames: 185 }, // → 23.57s
  ctl: { from: 707, durationInFrames: 245 }, // → 31.73s
  headline: { from: 952, durationInFrames: 123 }, // → 35.83s
  cta: { from: 1075, durationInFrames: 122 }, // → 39.90s
} as const;

export const FRAUNCES = '"Fraunces", "Times New Roman", serif';
export const SANS = '"Geist", system-ui, -apple-system, sans-serif';
export const MONO =
  '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';
