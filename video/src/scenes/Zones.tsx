import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TRAINING } from "../data";
import { C2024, C2025, C2026, FRAUNCES, INK, INK_MUTED, MONO } from "../tokens";
import { easeRange } from "../util";

const ZONE_COLORS = ["#78aac8", "#64a55c", "#e0c066", "#e67c50", "#d7644e"];

const YEARS = [2024, 2025, 2026] as const;
const YEAR_COLOR = { 2024: C2024, 2025: C2025, 2026: C2026 } as const;

export const Zones: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;

  const rows = YEARS.map((y) => {
    const z = TRAINING[String(y)].totals.hrZoneMin;
    const total = z.reduce((a, b) => a + b, 0);
    return { year: y, z, total };
  });
  const maxTotal = Math.max(...rows.map((r) => r.total));

  const titleOp = easeRange(frame, 0, 14);
  const factOp = easeRange(frame, 95, 130);

  function fmt(min: number) {
    const h = Math.floor(min / 60);
    return h > 0 ? `${h}h` : `${Math.round(min)}m`;
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: portrait ? H * 0.08 : H * 0.06,
          textAlign: "center",
          opacity: titleOp,
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
          HR zones · Jan → race
        </p>
        <h2
          style={{
            margin: "30px 0 0",
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontSize: portrait ? 96 : 76,
            fontWeight: 500,
            color: INK,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          Easy time tripled.
          <br />
          Hard time halved.
        </h2>
      </div>

      <div
        style={{
          position: "absolute",
          left: portrait ? 90 : 140,
          right: portrait ? 90 : 140,
          top: portrait ? H * 0.42 : H * 0.46,
          display: "flex",
          flexDirection: "column",
          gap: portrait ? 50 : 30,
        }}
      >
        {rows.map((r, ri) => {
          const rowFrom = 18 + ri * 16;
          const rowProgress = easeRange(frame, rowFrom, rowFrom + 40);
          const widthPct = (r.total / maxTotal) * 100 * rowProgress;
          return (
            <div key={r.year} style={{ display: "grid", gridTemplateColumns: portrait ? "180px 1fr" : "160px 1fr", gap: 28, alignItems: "center" }}>
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: portrait ? 28 : 22,
                    letterSpacing: 4,
                    color: YEAR_COLOR[r.year],
                    fontWeight: 600,
                  }}
                >
                  {r.year}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: portrait ? 36 : 28,
                    color: INK,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(r.total)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  width: `${widthPct}%`,
                  height: portrait ? 70 : 56,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {r.z.slice(0, 5).map((m, i) => {
                  const pct = (m / r.total) * 100;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: m,
                        background: ZONE_COLORS[i],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(0,0,0,0.78)",
                        fontFamily: MONO,
                        fontSize: portrait ? 22 : 18,
                        fontWeight: 700,
                      }}
                    >
                      {pct > 8 ? `${Math.round(pct)}%` : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: portrait ? H * 0.06 : H * 0.04,
          textAlign: "center",
          padding: "0 90px",
          opacity: factOp,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FRAUNCES,
            fontSize: portrait ? 38 : 30,
            fontWeight: 300,
            color: INK_MUTED,
            lineHeight: 1.3,
          }}
        >
          Z1 minutes <span style={{ color: C2026, fontWeight: 600 }}>2.9×</span>.
          Z5 minutes <span style={{ color: C2024, fontWeight: 600 }}>−62%</span>.
        </p>
      </div>
    </AbsoluteFill>
  );
};
