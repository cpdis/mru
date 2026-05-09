import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ROUTE_2026 } from "../data";
import { C2026, FRAUNCES, H, INK, INK_MUTED, MONO, W } from "../tokens";
import { easeRange, projectRoute } from "../util";

// 28–30s: closing CTA. Tiny route mark + the URL.

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const op = easeRange(frame, 0, 14);

  // Small icon in the upper third of the canvas.
  const routePoints = projectRoute(ROUTE_2026, {
    x: W / 2 - 90,
    y: H * 0.28,
    w: 180,
    h: 280,
  });

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

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.66,
          textAlign: "center",
          padding: "0 90px",
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
          The full story
        </p>
        <p
          style={{
            margin: "32px 0 0",
            fontFamily: MONO,
            fontSize: 100,
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
            fontSize: 38,
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
