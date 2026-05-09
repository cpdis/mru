import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LEGS } from "../data/course";

type Props = {
  geojsonUrl: string;
};

// Aid station coordinates, looked up from the GPX tracks at the cumulative
// distances from the rapidascent course description. These are
// approximate — close enough for a labeled marker.
const AID: { name: string; km: number; lng: number; lat: number }[] = [
  { name: "Hamelin Bay", km: 0, lng: 115.0272, lat: -34.2214 },
  { name: "Boranup Campsite", km: 11.5, lng: 115.0461, lat: -34.1668 },
  { name: "Contos Campground", km: 27.5, lng: 115.0395, lat: -34.0672 },
  { name: "Riflebutts Reserve", km: 47.0, lng: 114.9871, lat: -33.9716 },
  { name: "Gracetown", km: 65.5, lng: 114.9847, lat: -33.8607 },
  { name: "Howard Park Wines", km: 78.5, lng: 115.0299, lat: -33.7948 },
];

const YEAR_COLOR: Record<number, string> = {
  2024: "#C5743F",
  2025: "#2F6F6B",
  2026: "#3F5C3A",
};

export default function CourseMap({ geojsonUrl }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      // OpenFreeMap "liberty" — free vector tiles, more cartographic
      // texture (light terrain shading, contour‑aware roads) than positron.
      style: "https://tiles.openfreemap.org/styles/liberty",
      bounds: [
        [114.95, -34.27],
        [115.07, -33.78],
      ],
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      hash: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.on("load", async () => {
      try {
        const geo = await fetch(geojsonUrl).then((r) => r.json());
        map.addSource("runs", { type: "geojson", data: geo });

        // Draw each year as its own line with a halo for legibility.
        const years = [2024, 2025, 2026] as const;
        for (const y of years) {
          map.addLayer({
            id: `run-halo-${y}`,
            type: "line",
            source: "runs",
            filter: ["==", ["get", "year"], y],
            paint: {
              "line-color": "#F5F1E8",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
        }
        for (const y of years) {
          map.addLayer({
            id: `run-${y}`,
            type: "line",
            source: "runs",
            filter: ["==", ["get", "year"], y],
            paint: {
              "line-color": YEAR_COLOR[y],
              "line-width": 2.4,
              "line-opacity": y === 2026 ? 1 : 0.85,
            },
          });
        }

        // Aid station markers.
        for (const a of AID) {
          const el = document.createElement("div");
          el.className = "aid-marker";
          el.innerHTML = `
            <span class="aid-dot"></span>
            <span class="aid-label">${a.name}<br><span class="aid-km">${a.km} km</span></span>
          `;
          new maplibregl.Marker({ element: el, anchor: "left" })
            .setLngLat([a.lng, a.lat])
            .addTo(map);
        }

        map.fitBounds(
          [
            [114.96, -34.25],
            [115.06, -33.78],
          ],
          { padding: 36, duration: 0 }
        );
      } catch (err) {
        // Map data fetch can fail offline; surface a tiny note rather than
        // blocking the rest of the page.
        console.warn("course map failed", err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geojsonUrl]);

  return <div ref={ref} className="course-map" />;
}
