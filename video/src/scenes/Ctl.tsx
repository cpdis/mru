import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TRAINING } from "../data";
import {
  C2024,
  C2025,
  C2026,
  FRAUNCES,
  H,
  INK,
  INK_MUTED,
  MONO,
  RULE,
  W,
} from "../tokens";
import { easeRange } from "../util";

// 18–24s: CTL fitness curve. Three lines draw in left-to-right showing
// the chronic-training-load build per year. End peaks labelled.

const YEARS = [
  { y: 2024, c: C2024, fromFrame: 18 },
  { y: 2025, c: C2025, fromFrame: 28 },
  { y: 2026, c: C2026, fromFrame: 38 },
];

export const Ctl: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = easeRange(frame, 0, 14);

  const chartBox = { x: 90, y: H * 0.38, w: W - 180, h: 700 };

  // Find x and y domains.
  const allDays = YEARS.flatMap((y) =>
    TRAINING[String(y.y)].ctl.map((p) => p.dayIndex)
  );
  const allCtl = YEARS.flatMap((y) =>
    TRAINING[String(y.y)].ctl.map((p) => p.ctl)
  );
  const xMax = Math.max(...allDays);
  const yMax = Math.ceil(Math.max(...allCtl) / 20) * 20;

  function project(dayIndex: number, ctl: number): [number, number] {
    const x = chartBox.x + (dayIndex / xMax) * chartBox.w;
    const y = chartBox.y + chartBox.h - (ctl / yMax) * chartBox.h;
    return [x, y];
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.08,
          textAlign: "center",
          opacity: titleOp,
          padding: "0 80px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_MUTED,
            fontWeight: 600,
          }}
        >
          Fitness · CTL
        </p>
        <h2
          style={{
            margin: "30px 0 0",
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: 96,
            fontWeight: 500,
            color: INK,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          A higher floor
          <br />
          each year.
        </h2>
      </div>

      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* y-axis baseline */}
        <line
          x1={chartBox.x}
          x2={chartBox.x + chartBox.w}
          y1={chartBox.y + chartBox.h}
          y2={chartBox.y + chartBox.h}
          stroke={RULE}
          strokeWidth={2}
        />
        {/* Month tick marks at Jan/Feb/Mar/Apr/May (days 0/31/60/90/120) */}
        {[0, 31, 60, 90, 120].map((d) => {
          const x = chartBox.x + (d / xMax) * chartBox.w;
          return (
            <g key={d}>
              <line
                x1={x}
                x2={x}
                y1={chartBox.y}
                y2={chartBox.y + chartBox.h}
                stroke={RULE}
                strokeDasharray="2,8"
                opacity={0.4}
              />
              <text
                x={x}
                y={chartBox.y + chartBox.h + 38}
                textAnchor="middle"
                fontFamily="Geist Mono, monospace"
                fontSize={24}
                fill={INK_MUTED}
              >
                {["Jan", "Feb", "Mar", "Apr", "May"][[0, 31, 60, 90, 120].indexOf(d)]}
              </text>
            </g>
          );
        })}

        {YEARS.map(({ y, c, fromFrame }) => {
          const series = TRAINING[String(y)].ctl;
          if (series.length < 2) return null;

          // Slower draw + longer hold: line finishes by frame +120, then
          // sits there for the rest of the scene.
          const progress = easeRange(frame, fromFrame, fromFrame + 120);

          // Map progress directly to a position along the series indexed
          // 0..length-1. At progress=0 head is on series[0]; at 1.0 head
          // is on series[length-1] exactly. Avoids the off-by-one snap
          // that caused the dangling tail on the last frame.
          const exact = (series.length - 1) * progress;
          const lo = Math.floor(exact);
          const hi = Math.min(lo + 1, series.length - 1);
          const tail = exact - lo;

          const a = series[lo];
          const b = series[hi];
          const headDay = a.dayIndex + (b.dayIndex - a.dayIndex) * tail;
          const headCtl = a.ctl + (b.ctl - a.ctl) * tail;
          const [lx, ly] = project(headDay, headCtl);

          // Polyline goes through every complete sample up to lo, then
          // ends at the interpolated head. No back‑track, no kink.
          const completePts = series
            .slice(0, lo + 1)
            .map((p) => project(p.dayIndex, p.ctl));
          const allPts =
            tail > 0 && hi !== lo ? [...completePts, [lx, ly] as [number, number]] : completePts;
          const points = allPts
            .map(([x, py]) => `${x.toFixed(1)},${py.toFixed(1)}`)
            .join(" ");

          // Dot fades in once the line is well past the start; label
          // fades in just after so they don't both strobe.
          const dotOp = easeRange(frame, fromFrame + 60, fromFrame + 90);
          const labelOp = easeRange(frame, fromFrame + 95, fromFrame + 130);
          // Final headline value comes from the actual last sample so the
          // displayed number matches the line's true endpoint.
          const finalCtl = series[series.length - 1].ctl;

          return (
            <g key={y}>
              <polyline
                points={points}
                fill="none"
                stroke={c}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={lx} cy={ly} r={10} fill={c} opacity={dotOp} />
              <text
                x={lx + 18}
                y={ly + 10}
                fontFamily="Geist Mono, monospace"
                fontSize={32}
                fontWeight={700}
                fill={c}
                opacity={labelOp}
              >
                {y} · {Math.round(finalCtl)}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: H * 0.05,
          textAlign: "center",
          padding: "0 90px",
          opacity: easeRange(frame, 130, 160),
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontSize: 40,
            fontWeight: 300,
            color: INK_MUTED,
            lineHeight: 1.3,
          }}
        >
          From <span style={{ color: C2024, fontWeight: 600 }}>141</span>{" "}
          to <span style={{ color: C2026, fontWeight: 600 }}>234</span>.
        </p>
      </div>
    </AbsoluteFill>
  );
};
