import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ROUTE_2026 } from "../data";
import { C2026, FRAUNCES, INK, INK_MUTED, MONO } from "../tokens";
import { dashReveal, easeRange, projectRoute } from "../util";

// 0–~5.8s: title fades in, route line draws itself across the frame.
// Aspect-aware: route lives centre-right in landscape, centre-vertical
// in portrait, so the same component renders both Reels and 16:9.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;

  const routeBox = portrait
    ? { x: W * 0.18, y: H * 0.18, w: W * 0.64, h: H * 0.55 }
    : { x: W * 0.55, y: H * 0.1, w: W * 0.4, h: H * 0.8 };
  const routePoints = projectRoute(ROUTE_2026, routeBox);
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

  // In landscape the title block lives on the left half, vertically
  // centred. In portrait it stays at the bottom under the route.
  const titleBlock: React.CSSProperties = portrait
    ? { left: 0, right: 0, top: H * 0.78, textAlign: "center", padding: "0 80px" }
    : { left: 80, top: H * 0.36, width: W * 0.5, textAlign: "left" };
  const eyebrowBlock: React.CSSProperties = portrait
    ? { left: 0, right: 0, top: H * 0.08, textAlign: "center", padding: "0 80px" }
    : { left: 80, top: H * 0.18, width: W * 0.5, textAlign: "left" };

  const titleSize = portrait ? 110 : 130;
  const subSize = portrait ? 60 : 70;
  const eyebrowSize = portrait ? 30 : 24;

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
          ...eyebrowBlock,
          opacity: titleOp,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: eyebrowSize,
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
          ...titleBlock,
          opacity: subOp,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: titleSize,
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
            fontSize: subSize,
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
