import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ROUTE_2026 } from "../data";
import {
  C2026,
  FRAUNCES,
  H,
  INK,
  INK_MUTED,
  MONO,
  W,
} from "../tokens";
import { dashReveal, easeRange, projectRoute } from "../util";

// 0–3s: title fades in, route line draws itself across the frame.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // Route box: most of the screen height, centered horizontally.
  const routePoints = projectRoute(ROUTE_2026, {
    x: W * 0.18,
    y: H * 0.18,
    w: W * 0.64,
    h: H * 0.55,
  });
  // Estimate path length by summing segments. Polyline length for stroke
  // dash reveal.
  const pts = routePoints.split(" ").map((p) => p.split(",").map(Number));
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    len += Math.hypot(dx, dy);
  }

  const lineProgress = easeRange(frame, 6, 70);
  const titleOp = easeRange(frame, 0, 18);
  const subOp = easeRange(frame, 50, 70);

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <polyline
          points={routePoints}
          fill="none"
          stroke={C2026}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...dashReveal(len, lineProgress)}
        />
      </svg>

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
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_MUTED,
            fontWeight: 600,
          }}
        >
          Margaret River Ultra · 80 km
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.78,
          textAlign: "center",
          opacity: subOp,
          padding: "0 80px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: 110,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.0,
            letterSpacing: -2,
          }}
        >
          Three years.
        </h1>
        <p
          style={{
            marginTop: 24,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: 60,
            fontWeight: 300,
            color: C2026,
          }}
        >
          One coast.
        </p>
      </div>
    </AbsoluteFill>
  );
};
