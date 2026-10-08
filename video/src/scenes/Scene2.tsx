import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { C, sans } from "../theme"
import { Heading, Rise, SceneFrame, Sub, prog } from "../ui"

const pills = ["React Native", "Expo", "REST API"]

/** The promise: big two-line headline, a drawn underline, and what it works with. */
export const Scene2: React.FC = () => {
  const f = useCurrentFrame()
  const underline = prog(f, 62, 26)
  return (
    <SceneFrame>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <Heading lines={["Ship app content", "without shipping an update."]} start={4} size={132} align="center" stagger={9} />
          {/* underline under "an update." sits on the second line */}
          <div
            style={{
              position: "absolute",
              right: 8,
              bottom: -20,
              width: 440,
              height: 9,
              borderRadius: 5,
              background: C.blue,
              transform: `scaleX(${underline})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        <div style={{ height: 56 }} />
        <Sub
          lines={["Content, remote config, feature flags and offline caching", "in one mobile-first system."]}
          start={36}
          size={44}
          align="center"
        />
        <div style={{ height: 58 }} />
        <div style={{ display: "flex", gap: 18 }}>
          {pills.map((p, i) => (
            <Rise key={p} start={78 + i * 7} style={{ fontSize: 34 }}>
              <div style={{ background: "#fff", borderRadius: 999, padding: "16px 36px", fontFamily: sans, fontWeight: 500, color: C.fg }}>{p}</div>
            </Rise>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  )
}
