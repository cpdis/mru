import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { YearData } from "../lib/data";
import { LEGS } from "../data/course";

type Props = {
  runs: YearData[];
};

// HR over distance for all three years on a shared axis. Aid stations as
// vertical guides. The chart re‑renders on resize so it fills its container.
export default function HrCurtain({ runs }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const draw = () => {
      el.innerHTML = "";
      const w = el.clientWidth;

      const points = runs.flatMap((r) =>
        r.km
          .filter((b) => b.hr !== null)
          .map((b) => ({
            year: String(r.year),
            color: r.color,
            km: b.km,
            hr: b.hr as number,
          }))
      );

      const aid = LEGS.slice(0, -1).map((l) => l.cumulativeKm);

      const plot = Plot.plot({
        width: w,
        height: Math.min(440, Math.max(280, w * 0.42)),
        marginLeft: 48,
        marginRight: 16,
        marginTop: 28,
        marginBottom: 38,
        style: {
          background: "transparent",
          fontFamily: "Geist Mono, ui-monospace, monospace",
          fontSize: "11px",
          color: "#5a574e",
        },
        x: {
          label: "Distance (km) →",
          domain: [0, 80],
          ticks: [0, 11.5, 27.5, 47, 65.5, 78.5],
          tickFormat: (d: number) => String(d),
          grid: false,
        },
        y: {
          label: "Heart rate (bpm) ↑",
          domain: [120, 195],
          ticks: 5,
          grid: true,
        },
        marks: [
          // Aid station guides
          Plot.ruleX(aid, {
            stroke: "#c9c1ad",
            strokeDasharray: "2,3",
          }),
          // HR lines
          Plot.line(points, {
            x: "km",
            y: "hr",
            stroke: "color",
            strokeWidth: 1.6,
            curve: "catmull-rom",
            sort: { channel: "x" },
            z: "year",
          }),
          // Year labels anchored to each line's average HR around km 60 so
          // they don't pile on top of one another at the finish.
          ...runs.map((r) => {
            const anchorKm = 60;
            const bin = r.km
              .filter((b) => b.hr !== null)
              .reduce((best, b) =>
                Math.abs(b.km - anchorKm) < Math.abs(best.km - anchorKm) ? b : best
              );
            return Plot.text(
              [
                {
                  km: bin.km,
                  hr: (bin.hr as number) + (r.year === 2024 ? -8 : r.year === 2025 ? 0 : 8),
                  label: String(r.year),
                },
              ],
              {
                x: "km",
                y: "hr",
                text: "label",
                dx: 0,
                dy: 0,
                fontWeight: 700,
                fill: r.color,
                textAnchor: "middle",
                fontFamily: "Geist Mono",
                fontSize: 12,
                stroke: "#F5F1E8",
                strokeWidth: 4,
                paintOrder: "stroke",
              }
            );
          }) as any,
        ],
      });
      el.appendChild(plot);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [runs]);

  return <div ref={ref} className="hr-curtain" />;
}
