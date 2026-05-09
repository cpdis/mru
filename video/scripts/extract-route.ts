// Extract the 2026 race line from site/public/data/tracks.geojson into
// a plain .json file so Webpack/Remotion can import it without custom
// loaders.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "..", "site", "public", "data", "tracks.geojson");
const OUT_DIR = join(__dirname, "..", "src", "generated");
const OUT = join(OUT_DIR, "route2026.json");

const geo = JSON.parse(readFileSync(SRC, "utf8"));
const line = geo.features.find(
  (f: any) => f.properties.year === 2026
);
if (!line) throw new Error("2026 line not in tracks.geojson");

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(line.geometry.coordinates));
console.log(`Wrote ${OUT} (${line.geometry.coordinates.length} points)`);
