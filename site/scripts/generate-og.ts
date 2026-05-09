// Generate the Open Graph share image as a 1200x630 PNG. Combines the
// course map (the GPS line + aid station dots) with the headline title
// and the three finish times. Run via `pnpm og`.
//
// Renders an SVG, then rasterises it with @resvg/resvg-js — no headless
// browser required, fast and deterministic.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const DATA = join(PUBLIC, "data");

type LineFeature = {
  type: "Feature";
  properties: { year: number };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

const tracks = JSON.parse(
  readFileSync(join(DATA, "tracks.geojson"), "utf8")
) as { type: string; features: LineFeature[] };

const r2026 = JSON.parse(readFileSync(join(DATA, "2026.json"), "utf8")) as {
  aidStations: { name: string; km: number; lat: number; lon: number }[];
};

const line = tracks.features.find((f) => f.properties.year === 2026);
if (!line) throw new Error("2026 line not found in tracks.geojson");

const W = 1200;
const H = 630;

// Map area: right‑hand half, with margin.
const MAP_X = 660;
const MAP_Y = 60;
const MAP_W = 480;
const MAP_H = 510;

// Compute bbox of the line and aid stations.
const all = [
  ...line.geometry.coordinates,
  ...r2026.aidStations.map((a) => [a.lon, a.lat] as [number, number]),
];
let minLon = Infinity,
  maxLon = -Infinity,
  minLat = Infinity,
  maxLat = -Infinity;
for (const [lon, lat] of all) {
  if (lon < minLon) minLon = lon;
  if (lon > maxLon) maxLon = lon;
  if (lat < minLat) minLat = lat;
  if (lat > maxLat) maxLat = lat;
}
// 8% padding around the line so the labels don't kiss the edges.
const padLon = (maxLon - minLon) * 0.08;
const padLat = (maxLat - minLat) * 0.08;
minLon -= padLon;
maxLon += padLon;
minLat -= padLat;
maxLat += padLat;

// Equirectangular with cosLat correction so the shape isn't squashed.
const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
const lonSpan = (maxLon - minLon) * cosLat;
const latSpan = maxLat - minLat;
const scale = Math.min(MAP_W / lonSpan, MAP_H / latSpan);
const drawnW = lonSpan * scale;
const drawnH = latSpan * scale;
const offsetX = MAP_X + (MAP_W - drawnW) / 2;
const offsetY = MAP_Y + (MAP_H - drawnH) / 2;

function project(lon: number, lat: number): [number, number] {
  const x = offsetX + (lon - minLon) * cosLat * scale;
  const y = offsetY + (maxLat - lat) * scale;
  return [x, y];
}

const linePoints = line.geometry.coordinates
  .map(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  })
  .join(" ");

const aidMarks = r2026.aidStations
  .map((a) => {
    const [x, y] = project(a.lon, a.lat);
    return { name: a.name, km: a.km, x, y };
  });

// Color tokens — match the dark theme so the OG matches what people see
// when they tap through (most messaging clients show OG in dark surfaces).
const PAPER = "#0a0a0a";
const PAPER_DEEP = "#141413";
const INK = "#ede9dd";
const INK_MUTED = "#8a857b";
const RULE = "#2a2823";
const C2024 = "#e8a06f";
const C2025 = "#5cb1ac";
const C2026 = "#93c285";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
      <circle cx="44" cy="66" r="0.8" fill="${INK}" opacity="0.05"/>
      <circle cx="154" cy="176" r="0.8" fill="${INK}" opacity="0.04"/>
    </pattern>
    <filter id="halo">
      <feMorphology operator="dilate" radius="3"/>
      <feFlood flood-color="${PAPER}"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Map panel background -->
  <rect x="${MAP_X - 20}" y="${MAP_Y - 20}" width="${MAP_W + 40}" height="${MAP_H + 40}"
        fill="${PAPER_DEEP}" stroke="${RULE}" stroke-width="1" rx="3"/>

  <!-- Route line: white halo then the brand forest green on top. -->
  <polyline points="${linePoints}"
            fill="none" stroke="${PAPER}" stroke-width="6"
            stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <polyline points="${linePoints}"
            fill="none" stroke="${C2026}" stroke-width="2.6"
            stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Aid stations -->
  ${aidMarks
    .map(
      (a) => `
    <circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="6"
            fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>
    <circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="2.5"
            fill="${INK}"/>`
    )
    .join("")}

  <!-- Eyebrow -->
  <text x="60" y="120"
        font-family="'Geist Mono', ui-monospace, monospace"
        font-size="16" letter-spacing="3" fill="${INK_MUTED}"
        font-weight="600">
    MARGARET RIVER ULTRA · 80 KM
  </text>

  <!-- Display title in serif italic, two lines -->
  <text x="60" y="220"
        font-family="Fraunces, Georgia, serif"
        font-size="86" font-style="italic" font-weight="500"
        fill="${INK}" letter-spacing="-2">Three years on</text>
  <text x="60" y="310"
        font-family="Fraunces, Georgia, serif"
        font-size="86" font-style="italic" font-weight="500"
        fill="${C2026}" letter-spacing="-2">the Cape to Cape.</text>

  <!-- Three finish times row -->
  <g transform="translate(60, 410)">
    <line x1="0" y1="0" x2="0" y2="80" stroke="${C2024}" stroke-width="3"/>
    <text x="14" y="22"
          font-family="'Geist Mono', monospace" font-size="14"
          letter-spacing="2" fill="${INK_MUTED}" font-weight="600">2024</text>
    <text x="14" y="74"
          font-family="'Geist Mono', monospace" font-size="56"
          fill="${C2024}" font-weight="500">8:34</text>

    <line x1="200" y1="0" x2="200" y2="80" stroke="${C2025}" stroke-width="3"/>
    <text x="214" y="22"
          font-family="'Geist Mono', monospace" font-size="14"
          letter-spacing="2" fill="${INK_MUTED}" font-weight="600">2025</text>
    <text x="214" y="74"
          font-family="'Geist Mono', monospace" font-size="56"
          fill="${C2025}" font-weight="500">8:04</text>

    <line x1="400" y1="0" x2="400" y2="80" stroke="${C2026}" stroke-width="3"/>
    <text x="414" y="22"
          font-family="'Geist Mono', monospace" font-size="14"
          letter-spacing="2" fill="${INK_MUTED}" font-weight="600">2026</text>
    <text x="414" y="74"
          font-family="'Geist Mono', monospace" font-size="56"
          fill="${C2026}" font-weight="500">7:29</text>
  </g>

  <!-- Footer line -->
  <text x="60" y="555"
        font-family="Fraunces, Georgia, serif"
        font-size="22" font-style="italic" fill="${INK_MUTED}">
    Same course. Same heart rate. Sixty‑five minutes faster.
  </text>
  <text x="60" y="592"
        font-family="'Geist Mono', monospace"
        font-size="14" letter-spacing="2" fill="${INK_MUTED}" font-weight="500">
    MRU.CPD.DEV
  </text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  // Bundle Fraunces + Geist Mono fallbacks. resvg falls back to system
  // serif/mono if it can't find them — fine for this purpose since most
  // messaging previews are tiny anyway.
  font: {
    loadSystemFonts: true,
    defaultFontFamily: "Georgia",
  },
  background: PAPER,
});
const png = resvg.render().asPng();

const out = join(PUBLIC, "og.png");
writeFileSync(out, png);
console.log(`Wrote ${out} (${(png.length / 1024).toFixed(1)} KB)`);

// ---------- Favicon: project the route into a 32x32 viewBox ----------
//
// The course shape is iconic — a vertical squiggle hugging the WA coast.
// At 32x32 it still reads as a winding line. Use the simplified GeoJSON
// (already what the map ships) so the favicon matches the on‑page route.

const FAV = 32;
const FAV_PAD = 4;
const FAV_INNER = FAV - FAV_PAD * 2;

// Reproject just for the favicon.
const favScale = Math.min(
  FAV_INNER / lonSpan,
  FAV_INNER / latSpan
);
const favDrawnW = lonSpan * favScale;
const favDrawnH = latSpan * favScale;
const favOffsetX = FAV_PAD + (FAV_INNER - favDrawnW) / 2;
const favOffsetY = FAV_PAD + (FAV_INNER - favDrawnH) / 2;

const favPoints = line.geometry.coordinates
  .map(([lon, lat]) => {
    const x = favOffsetX + (lon - minLon) * cosLat * favScale;
    const y = favOffsetY + (maxLat - lat) * favScale;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  })
  .join(" ");

// Two‑tone favicon: forest green on transparent works in light tabs, but
// some browsers (Safari) compose against the toolbar so the line can fade
// out. Add a subtle dark backdrop circle for guaranteed contrast in any
// theme, with the route on top.
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FAV} ${FAV}">
  <rect width="${FAV}" height="${FAV}" rx="6" fill="#0a0a0a"/>
  <polyline points="${favPoints}" fill="none" stroke="${C2026}"
            stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
writeFileSync(join(PUBLIC, "favicon.svg"), faviconSvg);
console.log(`Wrote ${join(PUBLIC, "favicon.svg")}`);

// Apple touch icon: 180x180 PNG of the same mark, scaled up.
const TOUCH = 180;
const TOUCH_PAD = 24;
const TOUCH_INNER = TOUCH - TOUCH_PAD * 2;
const touchScale = Math.min(TOUCH_INNER / lonSpan, TOUCH_INNER / latSpan);
const touchDrawnW = lonSpan * touchScale;
const touchDrawnH = latSpan * touchScale;
const touchOffsetX = TOUCH_PAD + (TOUCH_INNER - touchDrawnW) / 2;
const touchOffsetY = TOUCH_PAD + (TOUCH_INNER - touchDrawnH) / 2;
const touchPoints = line.geometry.coordinates
  .map(([lon, lat]) => {
    const x = touchOffsetX + (lon - minLon) * cosLat * touchScale;
    const y = touchOffsetY + (maxLat - lat) * touchScale;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  })
  .join(" ");

const touchSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TOUCH} ${TOUCH}">
  <rect width="${TOUCH}" height="${TOUCH}" rx="36" fill="#0a0a0a"/>
  <polyline points="${touchPoints}" fill="none" stroke="${C2026}"
            stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const touchPng = new Resvg(touchSvg, {
  fitTo: { mode: "width", value: TOUCH },
  background: "#0a0a0a",
}).render().asPng();
writeFileSync(join(PUBLIC, "apple-touch-icon.png"), touchPng);
console.log(
  `Wrote ${join(PUBLIC, "apple-touch-icon.png")} (${(
    touchPng.length / 1024
  ).toFixed(1)} KB)`
);
