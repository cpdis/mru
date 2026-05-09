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

    const readVar = (name: string, fallback: string) => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      return v || fallback;
    };

    const draw = () => {
      el.innerHTML = "";
      const w = el.clientWidth;
      const inkMuted = readVar("--ink-muted", "#5a574e");
      const rule = readVar("--rule", "#c9c1ad");
      const c2026 = readVar("--c-2026", "#3F5C3A");
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
          color: inkMuted,
        },
        x: { domain: [0, 80], label: "Distance (km) →", ticks: [0, 11.5, 27.5, 47, 65.5, 78.5] },
        y: { label: "Elevation (m) ↑", grid: true },
        marks: [
          Plot.areaY(profile, {
            x: "km",
            y: "ele",
            fill: c2026,
            fillOpacity: 0.18,
            curve: "monotone-x",
          }),
          Plot.lineY(profile, {
            x: "km",
            y: "ele",
            stroke: c2026,
            strokeWidth: 1.4,
            curve: "monotone-x",
          }),
          Plot.ruleX(aid.slice(1).map((a) => a.km), {
            stroke: rule,
            strokeDasharray: "2,3",
          }),
          Plot.text(aid, {
            x: (d: any) => (d.km + d.end) / 2,
            y: -6,
            text: (d: any) => `L${d.leg}`,
            fontFamily: "Geist Mono",
            fontWeight: 600,
            fill: inkMuted,
            dy: -2,
          }),
        ],
      });
      el.appendChild(plot);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    const mql = matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", draw);
    return () => {
      ro.disconnect();
      mql.removeEventListener("change", draw);
    };
  }, [reference]);

  return <div ref={ref} className="elevation-profile" />;
}
