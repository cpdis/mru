import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ROUTE_2026 } from "../data";
import { C2026, FRAUNCES, INK, INK_MUTED, MONO } from "../tokens";
import { easeRange, projectRoute } from "../util";

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  const op = easeRange(frame, 0, 14);

  // In landscape: route on the left, text on the right.
  // In portrait: route at top, text below.
  const routeBox = portrait
    ? { x: W / 2 - 90, y: H * 0.28, w: 180, h: 280 }
    : { x: W * 0.18, y: H * 0.18, w: 220, h: H * 0.64 };

  const routePoints = projectRoute(ROUTE_2026, routeBox);

  const textBlock: React.CSSProperties = portrait
    ? { left: 0, right: 0, top: H * 0.66, textAlign: "center", padding: "0 90px" }
    : { left: W * 0.4, right: 80, top: H * 0.32, textAlign: "left" };

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <polyline
          points={routePoints}
          fill="none"
          stroke={C2026}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div style={{ position: "absolute", ...textBlock }}>
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: portrait ? 28 : 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_MUTED,
            fontWeight: 600,
          }}
        >
          The full story
        </p>
        <p
          style={{
            margin: "32px 0 0",
            fontFamily: MONO,
            fontSize: portrait ? 100 : 110,
            fontWeight: 600,
            color: INK,
            letterSpacing: -2,
          }}
        >
          mru.cpd.dev
        </p>
        <p
          style={{
            margin: "30px 0 0",
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: portrait ? 38 : 32,
            fontWeight: 300,
            color: INK_MUTED,
          }}
        >
          three years on the Cape&nbsp;to&nbsp;Cape
        </p>
      </div>
    </AbsoluteFill>
  );
};
