import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RACE_TIMES } from "../data";
import { C2024, C2025, C2026, FRAUNCES, INK_MUTED, MONO } from "../tokens";
import { easeRange } from "../util";

// 5.8–11.7s: the three finish times stack in. In landscape they go
// side‑by‑side; in portrait they stack vertically.
const ROWS = [
  { year: 2024, time: RACE_TIMES[2024], color: C2024, fromFrame: 6 },
  { year: 2025, time: RACE_TIMES[2025], color: C2025, fromFrame: 28 },
  { year: 2026, time: RACE_TIMES[2026], color: C2026, fromFrame: 50 },
];

export const Times: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const portrait = H > W;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: portrait ? H * 0.1 : H * 0.13,
          textAlign: "center",
          opacity: easeRange(frame, 0, 18),
          padding: "0 80px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: portrait ? 28 : 24,
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
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: portrait ? 60 : 80,
          padding: portrait ? "0 90px" : "0 60px",
        }}
      >
        {ROWS.map((r) => {
          const s = spring({
            frame: frame - r.fromFrame,
            fps,
            config: { damping: 14, stiffness: 110, mass: 0.9 },
          });
          const tx = (1 - s) * (portrait ? -160 : 0);
          const ty = (1 - s) * (portrait ? 0 : 80);
          const op = Math.min(1, s);
          return (
            <div
              key={r.year}
              style={{
                display: "flex",
                flexDirection: portrait ? "row" : "column",
                alignItems: portrait ? "baseline" : "flex-start",
                gap: portrait ? 36 : 12,
                opacity: op,
                transform: `translate(${tx}px, ${ty}px)`,
                borderLeft: portrait ? `8px solid ${r.color}` : "none",
                borderTop: portrait ? "none" : `6px solid ${r.color}`,
                paddingLeft: portrait ? 36 : 24,
                paddingTop: portrait ? 0 : 18,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: portrait ? 40 : 30,
                  letterSpacing: 4,
                  color: INK_MUTED,
                  fontWeight: 600,
                  width: portrait ? 140 : "auto",
                }}
              >
                {r.year}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: portrait ? 220 : 200,
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
          bottom: portrait ? H * 0.08 : H * 0.06,
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
            fontSize: portrait ? 56 : 44,
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
