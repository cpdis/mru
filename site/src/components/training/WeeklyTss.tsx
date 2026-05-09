import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

type Series = {
  year: number;
  cssVar: string;
  weeks: { weekIndex: number; tss: number }[];
};

type Props = { series: Series[] };

export default function WeeklyTss({ series }: Props) {
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

      const points = series.flatMap((s) =>
        s.weeks.map((p) => ({
          year: String(s.year),
          color: readVar(s.cssVar, "#3F5C3A"),
          weekIndex: p.weekIndex,
          tss: p.tss,
        }))
      );

      const plot = Plot.plot({
        width: w,
        height: Math.min(360, Math.max(220, w * 0.32)),
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
          label: "Week of block →",
          tickFormat: (d: number) => `W${d + 1}`,
        },
        y: {
          label: "Weekly TSS ↑",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: rule }),
          Plot.line(points, {
            x: "weekIndex",
            y: "tss",
            stroke: "color",
            strokeWidth: 1.8,
            curve: "catmull-rom",
            sort: { channel: "x" },
            z: "year",
          }),
          Plot.dot(points, {
            x: "weekIndex",
            y: "tss",
            fill: "color",
            r: 2,
            z: "year",
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
  }, [series]);

  return <div ref={ref} className="weekly-tss" />;
}
