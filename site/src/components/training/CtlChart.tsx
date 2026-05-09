import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

type Series = {
  year: number;
  cssVar: string;
  // dayIndex ∈ [0, blockDays-1], paired with CTL value.
  ctl: { dayIndex: number; ctl: number }[];
};

type Props = {
  series: Series[];
};

// 42-day chronic training load over the Jan→race block per year. Exposes
// the aerobic build in a single line. Reads colors from CSS vars so dark
// mode picks up automatically.
export default function CtlChart({ series }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const readVar = (name: string, fb: string) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fb;
    };

    const draw = () => {
      el.innerHTML = "";
      const inkMuted = readVar("--ink-muted", "#5a574e");
      const rule = readVar("--rule", "#c9c1ad");
      const w = el.clientWidth;

      const points = series.flatMap((s) =>
        s.ctl.map((p) => ({
          year: String(s.year),
          color: readVar(s.cssVar, "#3F5C3A"),
          dayIndex: p.dayIndex,
          ctl: p.ctl,
        }))
      );

      const lastByYear = series.map((s) => {
        const last = s.ctl[s.ctl.length - 1];
        return {
          year: String(s.year),
          dayIndex: last.dayIndex,
          ctl: last.ctl,
          color: readVar(s.cssVar, "#3F5C3A"),
        };
      });

      const plot = Plot.plot({
        width: w,
        height: Math.min(420, Math.max(260, w * 0.4)),
        marginLeft: 48,
        marginRight: 64,
        marginTop: 24,
        marginBottom: 36,
        style: {
          background: "transparent",
          fontFamily: "Geist Mono, ui-monospace, monospace",
          fontSize: "11px",
          color: inkMuted,
        },
        x: {
          label: "Days into year →",
          domain: [0, Math.max(...series.map((s) => s.ctl[s.ctl.length - 1].dayIndex)) + 1],
          ticks: [0, 31, 60, 90, 120],
          tickFormat: (d: number) => {
            // Friendly labels at month boundaries (non-leap).
            const map: Record<number, string> = {
              0: "Jan",
              31: "Feb",
              60: "Mar",
              90: "Apr",
              120: "May",
            };
            return map[d] ?? String(d);
          },
        },
        y: {
          label: "CTL (chronic training load) ↑",
          grid: true,
          domain: [0, Math.ceil(Math.max(...points.map((p) => p.ctl)) / 20) * 20],
        },
        marks: [
          Plot.line(points, {
            x: "dayIndex",
            y: "ctl",
            stroke: "color",
            strokeWidth: 1.8,
            curve: "monotone-x",
            sort: { channel: "x" },
            z: "year",
          }),
          // Race-day markers per year.
          Plot.dot(lastByYear, {
            x: "dayIndex",
            y: "ctl",
            fill: "color",
            r: 4,
            stroke: readVar("--paper", "#f5f1e8"),
            strokeWidth: 2,
          }),
          Plot.text(lastByYear, {
            x: "dayIndex",
            y: "ctl",
            text: "year",
            dx: 8,
            dy: 0,
            textAnchor: "start",
            fill: "color",
            fontFamily: "Geist Mono",
            fontWeight: 700,
            fontSize: 12,
          }),
          Plot.ruleY([0], { stroke: rule }),
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

  return <div ref={ref} className="ctl-chart" />;
}
