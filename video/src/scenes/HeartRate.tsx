import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  C2024,
  C2025,
  C2026,
  FRAUNCES,
  INK,
  INK_MUTED,
  MONO,
  PAPER_DEEP,
  RULE,
} from "../tokens";
import { easeRange } from "../util";

// 11.7–17.4s: same average HR all three years. Three faint traces
// converging to a flat line at the centre, with the big number on top.
export const HeartRate: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;

  const eyebrowOp = easeRange(frame, 0, 14);
  const numberPop = easeRange(frame, 14, 50);
  const subOp = easeRange(frame, 60, 90);
  const factOp = easeRange(frame, 90, 120);

  const traceY = H * 0.5;
  const traceLeft = portrait ? 80 : 200;
  const traceRight = W - traceLeft;
  const samples = 80;
  function trace(amp: number, phase: number, color: string, op: number) {
    const pts: string[] = [];
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const x = traceLeft + (traceRight - traceLeft) * t;
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

  const numberSize = portrait ? 320 : 280;
  const bpmSize = portrait ? 60 : 48;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: portrait ? H * 0.12 : H * 0.1,
          textAlign: "center",
          opacity: eyebrowOp,
          padding: "0 80px",
        }}
      >
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
          top: portrait ? H * 0.32 : H * 0.22,
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
            fontSize: numberSize,
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
            fontSize: bpmSize,
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
          top: portrait ? H * 0.68 : H * 0.62,
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
            fontSize: portrait ? 64 : 52,
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
          bottom: portrait ? H * 0.1 : H * 0.06,
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
            fontSize: portrait ? 44 : 34,
            fontWeight: 300,
            color: INK_MUTED,
            lineHeight: 1.3,
          }}
        >
          Same effort.
          {portrait && <br />}
          {!portrait && " "}
          Different fitness.
        </p>
      </div>

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
