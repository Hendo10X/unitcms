import React from "react"
import { interpolate, interpolateColors, useCurrentFrame } from "remotion"
import { C, sans } from "../theme"
import { DrawRect, Hex, Roll, SceneFrame, TextColumn, inOut, prog } from "../ui"

const PHONE = { x: 1140, y: 120, w: 440, h: 820 }
const CHIPS = ["offline", "cache", "network"]

/** Caching: offline shows cached content, then the network brings it up to date. */
export const Scene7: React.FC = () => {
  const f = useCurrentFrame()
  const spin = prog(f, 26, 160, inOut) * 200
  // which source is active: offline → cache → network
  const idx = interpolate(f, [60, 82, 128, 150], [0, 1, 1, 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut })
  const label = prog(f, 142, 20, inOut)

  return (
    <SceneFrame>
      <TextColumn
        eyebrow="Caching"
        lines={["Instant. Cached.", "Offline-ready."]}
        sub={["Content stays on screen without a signal,", "then refreshes quietly in the background."]}
      />

      <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h }}>
        <DrawRect w={PHONE.w} h={PHONE.h} r={72} t={prog(f, 0, 36, inOut)} />
        <div style={{ position: "absolute", left: (PHONE.w - 140) / 2, top: 20, width: 140, height: 42 }}>
          <DrawRect w={140} h={42} r={21} t={prog(f, 12, 24, inOut)} sw={2} />
        </div>

        {/* ring */}
        <div
          style={{
            position: "absolute",
            left: (PHONE.w - 320) / 2,
            top: 150,
            width: 320,
            height: 320,
            transform: `rotate(${spin}deg)`,
          }}
        >
          <DrawRect w={320} h={320} r={160} t={prog(f, 14, 40, inOut)} />
          <div
            style={{
              position: "absolute",
              inset: 26,
              borderRadius: "50%",
              border: `2.5px dashed ${C.blueMid}`,
              clipPath: `inset(0 ${(1 - prog(f, 30, 30)) * 100}% 0 0)`,
            }}
          />
          <div style={{ position: "absolute", left: 160 - 20, top: -20, transform: `scale(${prog(f, 40, 20)})` }}>
            <Hex size={40} />
          </div>
        </div>

        {/* status label in the middle of the ring */}
        <div style={{ position: "absolute", left: PHONE.w / 2 - 80, top: 150 + 160 - 26, width: 160, height: 52, overflow: "hidden", borderRadius: 8 }}>
          <Roll
            t={label}
            height={52}
            from={<Pill text="Cached" />}
            to={<Pill text="Fresh" />}
            style={{ display: "block" }}
          />
        </div>

        {/* source chips */}
        <div style={{ position: "absolute", left: 38, right: 38, top: 560, display: "flex", gap: 14 }}>
          {CHIPS.map((c, i) => {
            const near = Math.max(0, 1 - Math.abs(idx - i))
            return (
              <div
                key={c}
                style={{
                  flex: 1,
                  height: 64,
                  borderRadius: 32,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 25,
                  background: interpolateColors(near, [0, 1], ["#f0f0ee", C.blue]),
                  color: interpolateColors(near, [0, 1], [C.muted, "#ffffff"]),
                  transform: `translateY(${(1 - prog(f, 50 + i * 6, 22)) * 140}px)`,
                }}
              >
                {c}
              </div>
            )
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 38,
            right: 38,
            top: 650,
            fontFamily: sans,
            fontSize: 26,
            color: C.muted,
            textAlign: "center",
            overflow: "hidden",
            height: 44,
          }}
        >
          {["Offline: serving the last known content", "Cache hit: on screen instantly", "Network: fresh content, cache updated"].map((s, i) => (
            <div
              key={s}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 44,
                lineHeight: "44px",
                whiteSpace: "nowrap",
                transform: `translateY(${(i - (prog(f, 82, 18, inOut) + prog(f, 150, 18, inOut))) * 44}px)`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  )
}

const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      background: C.blue,
      color: "#fff",
      fontFamily: sans,
      fontWeight: 600,
      fontSize: 26,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      height: 52,
      lineHeight: "52px",
      textAlign: "center",
      borderRadius: 8,
    }}
  >
    {text}
  </div>
)
