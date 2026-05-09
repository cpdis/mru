import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Aid = { name: string; km: number; lat: number; lon: number };

type Props = {
  geojsonUrl: string;
  aidStations: Aid[];
  // Read at draw time from the live CSS variable so the line picks up the
  // dark‑mode override without a separate prop.
  routeCssVar: string;
  // Which year's track to render. The course is the same every year so we
  // just show one — defaults to the most recent.
  year?: number;
};

// Map styles: a light cartographic style for daytime and a dark variant
// that pairs nicely with the OLED theme. Both are free, no API key.
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

function preferredStyle(): string {
  if (typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-color-scheme: dark)").matches) {
    return STYLE_DARK;
  }
  return STYLE_LIGHT;
}

function readVar(name: string, fallback: string): string {
  if (typeof getComputedStyle === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export default function CourseMap({
  geojsonUrl,
  aidStations,
  routeCssVar,
  year = 2026,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: preferredStyle(),
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

    const drawRunLayers = () => {
      // Halo and route colors come from live CSS vars so they swap with
      // the active color scheme.
      const halo = readVar("--paper", "#F5F1E8");
      const route = readVar(routeCssVar, "#3F5C3A");
      map.addLayer({
        id: "run-halo",
        type: "line",
        source: "runs",
        filter: ["==", ["get", "year"], year],
        paint: {
          "line-color": halo,
          "line-width": 6,
          "line-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "run-line",
        type: "line",
        source: "runs",
        filter: ["==", ["get", "year"], year],
        paint: {
          "line-color": route,
          "line-width": 2.6,
          "line-opacity": 1,
        },
      });
    };

    map.on("load", async () => {
      try {
        const geo = await fetch(geojsonUrl).then((r) => r.json());
        map.addSource("runs", { type: "geojson", data: geo });
        drawRunLayers();

        // Aid station markers, snapped to the actual GPS track.
        for (const a of aidStations) {
          const el = document.createElement("div");
          el.className = "aid-marker";
          el.innerHTML = `
            <span class="aid-dot"></span>
            <span class="aid-label">${a.name}<br><span class="aid-km">${a.km} km</span></span>
          `;
          new maplibregl.Marker({ element: el, anchor: "left" })
            .setLngLat([a.lon, a.lat])
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
        console.warn("course map failed", err);
      }
    });

    // Live‑swap the basemap style when the user toggles their OS theme.
    // We have to re‑add the source/layers after the new style finishes
    // loading because MapLibre wipes them on style.setStyle.
    const mql = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      map.setStyle(preferredStyle());
      map.once("styledata", async () => {
        if (!map.getSource("runs")) {
          const geo = await fetch(geojsonUrl).then((r) => r.json());
          map.addSource("runs", { type: "geojson", data: geo });
        }
        drawRunLayers();
      });
    };
    mql.addEventListener("change", onScheme);

    return () => {
      mql.removeEventListener("change", onScheme);
      map.remove();
      mapRef.current = null;
    };
  }, [geojsonUrl, aidStations, routeCssVar, year]);

  return <div ref={ref} className="course-map" />;
}
