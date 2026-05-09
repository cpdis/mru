import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

type Series = {
  year: number;
  cssVar: string;
  weeks: { weekIndex: number; longRunKm: number }[];
};

type Props = { series: Series[] };

export default function LongRunChart({ series }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const readVar = (name: string, fb: string) => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      return v || fb;
    };

    const draw = () => {
      el.innerHTML = "";
      const inkMuted = readVar("--ink-muted", "#5a574e");
      const rule = readVar("--rule", "#c9c1ad");
      const w = el.clientWidth;

      const totalWeeks = Math.max(
        ...series.map((s) => Math.max(...s.weeks.map((p) => p.weekIndex)))
      );

      // x = weeks BEFORE race (totalWeeks - weekIndex), so 0 is race week
      // and the build is right-to-left visually.
      const points = series.flatMap((s) =>
        s.weeks
          .filter((p) => p.longRunKm > 0)
          .map((p) => ({
            year: String(s.year),
            color: readVar(s.cssVar, "#3F5C3A"),
            // Convert to weeks‑before‑race so all 3 years align at the
            // race itself rather than at Jan 1.
            weeksBeforeRace: totalWeeks - p.weekIndex,
            km: p.longRunKm,
          }))
      );

      const plot = Plot.plot({
        width: w,
        height: Math.min(380, Math.max(240, w * 0.34)),
        marginLeft: 48,
        marginRight: 16,
        marginTop: 20,
        marginBottom: 36,
        style: {
          background: "transparent",
          fontFamily: "Geist Mono, ui-monospace, monospace",
          fontSize: "11px",
          color: inkMuted,
        },
        x: {
          label: "Weeks before race →",
          domain: [totalWeeks + 0.5, -0.5],
          ticks: [0, 4, 8, 12, 16, 18],
          tickFormat: (d: number) => (d === 0 ? "RACE" : `−${d}`),
        },
        y: { label: "Longest run that week (km) ↑", grid: true },
        marks: [
          Plot.ruleY([0], { stroke: rule }),
          Plot.line(points, {
            x: "weeksBeforeRace",
            y: "km",
            stroke: "color",
            strokeWidth: 1.6,
            curve: "monotone-x",
            sort: { channel: "x" },
            z: "year",
          }),
          Plot.dot(points, {
            x: "weeksBeforeRace",
            y: "km",
            fill: "color",
            r: 2.5,
            z: "year",
          }),
          Plot.ruleX([0], { stroke: rule, strokeDasharray: "2,3" }),
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
  }, [series]);

  return <div ref={ref} className="longrun-chart" />;
}
