// Shared helpers across scenes.

import { interpolate } from "remotion";

// Project a [lon, lat] coordinate list into a target box [x, y, w, h] with
// equirectangular projection + cosLat correction. Returns SVG points.
export function projectRoute(
  coords: [number, number][],
  box: { x: number; y: number; w: number; h: number },
  pad = 0.05
): string {
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const padLon = (maxLon - minLon) * pad;
  const padLat = (maxLat - minLat) * pad;
  minLon -= padLon;
  maxLon += padLon;
  minLat -= padLat;
  maxLat += padLat;
  const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const lonSpan = (maxLon - minLon) * cosLat;
  const latSpan = maxLat - minLat;
  const scale = Math.min(box.w / lonSpan, box.h / latSpan);
  const drawnW = lonSpan * scale;
  const drawnH = latSpan * scale;
  const ox = box.x + (box.w - drawnW) / 2;
  const oy = box.y + (box.h - drawnH) / 2;
  return coords
    .map(([lon, lat]) => {
      const x = ox + (lon - minLon) * cosLat * scale;
      const y = oy + (maxLat - lat) * scale;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

// Reveal a polyline by adjusting strokeDasharray. Pass the total path
// length and a 0..1 progress value.
export function dashReveal(totalLength: number, progress: number) {
  const drawn = totalLength * progress;
  return {
    strokeDasharray: `${drawn} ${totalLength}`,
    strokeDashoffset: 0,
  };
}

// Eased frame-range remap: 0 outside the range, 0..1 inside, ease in-out.
export function easeRange(frame: number, from: number, to: number): number {
  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Simple cubic ease-in-out.
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
