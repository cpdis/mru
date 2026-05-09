import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { YearData } from "../lib/data";
import { LEGS } from "../data/course";

type Props = {
  // Use a single year as the elevation reference; all years run the same
  // course, so this is just "the course profile".
  reference: YearData;
};

export default function ElevationProfile({ reference }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const draw = () => {
      el.innerHTML = "";
      const w = el.clientWidth;
      const profile = reference.km.map((b) => ({ km: b.km, ele: b.ele }));
      const aid = LEGS.map((l, i) => ({
        km: i === 0 ? 0 : LEGS[i - 1].cumulativeKm,
        end: l.cumulativeKm,
        name: l.name,
        leg: l.index,
      }));

      const plot = Plot.plot({
        width: w,
        height: Math.min(280, Math.max(200, w * 0.28)),
        marginLeft: 44,
        marginRight: 14,
        marginTop: 14,
        marginBottom: 36,
        style: {
          background: "transparent",
          fontFamily: "Geist Mono, ui-monospace, monospace",
          fontSize: "11px",
          color: "#5a574e",
        },
        x: { domain: [0, 80], label: "Distance (km) →", ticks: [0, 11.5, 27.5, 47, 65.5, 78.5] },
        y: { label: "Elevation (m) ↑", grid: true },
        marks: [
          Plot.areaY(profile, {
            x: "km",
            y: "ele",
            fill: "#3F5C3A",
            fillOpacity: 0.16,
            curve: "monotone-x",
          }),
          Plot.lineY(profile, {
            x: "km",
            y: "ele",
            stroke: "#3F5C3A",
            strokeWidth: 1.4,
            curve: "monotone-x",
          }),
          Plot.ruleX(aid.slice(1).map((a) => a.km), {
            stroke: "#c9c1ad",
            strokeDasharray: "2,3",
          }),
          Plot.text(aid, {
            x: (d: any) => (d.km + d.end) / 2,
            y: -6,
            text: (d: any) => `L${d.leg}`,
            fontFamily: "Geist Mono",
            fontWeight: 600,
            fill: "#5a574e",
            dy: -2,
          }),
        ],
      });
      el.appendChild(plot);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reference]);

  return <div ref={ref} className="elevation-profile" />;
}
