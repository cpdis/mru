import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Aid = { name: string; km: number; lat: number; lon: number };

type Props = {
  geojsonUrl: string;
  aidStations: Aid[];
  routeColor: string;
  // Which year's track to render. The course is the same every year so we
  // just show one — defaults to the most recent.
  year?: number;
};

export default function CourseMap({
  geojsonUrl,
  aidStations,
  routeColor,
  year = 2026,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
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

        // Just the selected year's track. White halo for legibility, then
        // the colored line over the top.
        map.addLayer({
          id: "run-halo",
          type: "line",
          source: "runs",
          filter: ["==", ["get", "year"], year],
          paint: {
            "line-color": "#F5F1E8",
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
            "line-color": routeColor,
            "line-width": 2.6,
            "line-opacity": 1,
          },
        });

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geojsonUrl, aidStations, routeColor, year]);

  return <div ref={ref} className="course-map" />;
}
