import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RACE_TIMES } from "../data";
import { C2024, C2025, C2026, FRAUNCES, H, INK_MUTED, MONO, W } from "../tokens";
import { easeRange } from "../util";

// 3–8s: the three finish times stack in, biggest motion of the reel.
const ROWS = [
  { year: 2024, time: RACE_TIMES[2024], color: C2024, fromFrame: 6 },
  { year: 2025, time: RACE_TIMES[2025], color: C2025, fromFrame: 28 },
  { year: 2026, time: RACE_TIMES[2026], color: C2026, fromFrame: 50 },
];

export const Times: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.1,
          textAlign: "center",
          opacity: easeRange(frame, 0, 18),
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
          Same race, three Mays
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 60,
          padding: "0 90px",
        }}
      >
        {ROWS.map((r) => {
          const s = spring({
            frame: frame - r.fromFrame,
            fps,
            config: { damping: 14, stiffness: 110, mass: 0.9 },
          });
          const tx = (1 - s) * -160;
          const op = Math.min(1, s);
          return (
            <div
              key={r.year}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 36,
                opacity: op,
                transform: `translateX(${tx}px)`,
                borderLeft: `8px solid ${r.color}`,
                paddingLeft: 36,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 40,
                  letterSpacing: 4,
                  color: INK_MUTED,
                  fontWeight: 600,
                  width: 140,
                }}
              >
                {r.year}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 220,
                  fontWeight: 500,
                  color: r.color,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.time}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: H * 0.08,
          textAlign: "center",
          padding: "0 80px",
          opacity: easeRange(frame, 90, 120),
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: 56,
            fontWeight: 400,
            color: C2026,
          }}
        >
          Sixty‑five minutes faster.
        </p>
      </div>
    </AbsoluteFill>
  );
};
