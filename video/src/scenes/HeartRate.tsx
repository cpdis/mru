import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C2024,
  C2025,
  C2026,
  FRAUNCES,
  H,
  INK,
  INK_MUTED,
  MONO,
  PAPER_DEEP,
  RULE,
  W,
} from "../tokens";
import { easeRange } from "../util";

// 8–13s: the headline punch. Same average HR all three years. The visual
// is a horizontal "scope" with three faint traces converging to one bold
// line at 163, then the big number.

export const HeartRate: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrowOp = easeRange(frame, 0, 14);
  const numberPop = easeRange(frame, 14, 50);
  const subOp = easeRange(frame, 60, 90);
  const factOp = easeRange(frame, 90, 120);

  // Three squiggle paths converging to the same horizontal line. Built
  // procedurally using sine waves of slightly different amplitudes.
  const traceY = H * 0.5;
  const traceLeft = 80;
  const traceRight = W - 80;
  const samples = 80;
  function trace(amp: number, phase: number, color: string, op: number) {
    const pts: string[] = [];
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const x = traceLeft + (traceRight - traceLeft) * t;
      // Damping converges to flat by the right end.
      const damping = 1 - t;
      const y = traceY + Math.sin(t * 14 + phase) * amp * damping;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return (
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={4}
        opacity={op}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.12,
          textAlign: "center",
          opacity: eyebrowOp,
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
          Average heart rate
        </p>
      </div>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={traceLeft}
          x2={traceRight}
          y1={traceY}
          y2={traceY}
          stroke={RULE}
          strokeDasharray="4,8"
        />
        {trace(120, 0.4, C2024, easeRange(frame, 6, 36) * 0.7)}
        {trace(95, 1.2, C2025, easeRange(frame, 14, 44) * 0.7)}
        {trace(110, 2.7, C2026, easeRange(frame, 22, 52) * 0.85)}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.32,
          textAlign: "center",
          opacity: numberPop,
          transform: `scale(${0.86 + numberPop * 0.14})`,
          transformOrigin: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 320,
            fontWeight: 500,
            color: INK,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          163
        </p>
        <p
          style={{
            margin: 0,
            marginTop: -10,
            fontFamily: MONO,
            fontSize: 60,
            letterSpacing: 4,
            color: INK_MUTED,
            fontWeight: 500,
          }}
        >
          BPM
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.68,
          textAlign: "center",
          padding: "0 90px",
          opacity: subOp,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: 64,
            fontWeight: 400,
            color: INK,
            lineHeight: 1.15,
          }}
        >
          Every year.
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: H * 0.1,
          textAlign: "center",
          padding: "0 90px",
          opacity: factOp,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontStyle: "normal",
            fontSize: 44,
            fontWeight: 300,
            color: INK_MUTED,
            lineHeight: 1.3,
          }}
        >
          Same effort.
          <br />
          Different fitness.
        </p>
      </div>

      {/* Background tint to focus the eye on the centre. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 0%, ${PAPER_DEEP} 90%)`,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </AbsoluteFill>
  );
};
