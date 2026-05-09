import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C2026, FRAUNCES, INK, INK_MUTED, MONO } from "../tokens";
import { easeRange } from "../util";

export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;

  const op1 = easeRange(frame, 0, 18);
  const op2 = easeRange(frame, 24, 42);

  // Landscape can fit it on one or two lines comfortably.
  const titleSize = portrait ? 180 : 200;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 90px" }}>
        <p
          style={{
            margin: 0,
            marginBottom: 60,
            fontFamily: MONO,
            fontSize: portrait ? 30 : 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_MUTED,
            fontWeight: 600,
            opacity: op1,
          }}
        >
          The takeaway
        </p>
        <h2
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: titleSize,
            fontWeight: 500,
            color: INK,
            lineHeight: 0.95,
            letterSpacing: -3,
            opacity: op1,
          }}
        >
          Train slower,
        </h2>
        <h2
          style={{
            margin: "20px 0 0 0",
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: titleSize,
            fontWeight: 500,
            color: C2026,
            lineHeight: 0.95,
            letterSpacing: -3,
            opacity: op2,
          }}
        >
          race faster.
        </h2>
      </div>
    </AbsoluteFill>
  );
};
