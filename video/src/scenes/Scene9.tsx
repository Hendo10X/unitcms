import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { C, sans } from "../theme"
import { Heading, LogoMark, Rise, SceneFrame, inOut, prog } from "../ui"

/** End card on the brand blue, like the site footer. */
export const Scene9: React.FC = () => {
  const f = useCurrentFrame()
  return (
    <SceneFrame bg={C.blue} railColor="rgba(255,255,255,0.35)">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <LogoMark size={140} light inner={prog(f, 2, 24)} rotate={prog(f, 16, 54, inOut) * 360} />
          <Rise start={6} style={{ fontSize: 120, lineHeight: 1.05 }}>
            <span style={{ fontFamily: sans, fontWeight: 500, letterSpacing: "-0.0514em", color: "#fff" }}>UnitCMS</span>
          </Rise>
        </div>
        <div style={{ height: 64 }} />
        <Heading lines={["Ship app content", "without shipping an update."]} start={22} size={86} color="#fff" align="center" />
        <div style={{ height: 60 }} />
        <Rise start={50} style={{ fontSize: 40 }}>
          <div
            style={{
              background: "#fff",
              color: C.blue,
              fontFamily: sans,
              fontWeight: 500,
              borderRadius: 999,
              padding: "24px 64px",
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              letterSpacing: "-0.2px",
            }}
          >
            Start building <span style={{ fontSize: 44 }}>→</span>
          </div>
        </Rise>
        <div style={{ height: 34 }} />
        <Rise start={60} style={{ fontSize: 34 }}>
          <span style={{ fontFamily: sans, color: "rgba(255,255,255,0.8)", letterSpacing: "-0.2px" }}>unitcms.dev</span>
        </Rise>
      </AbsoluteFill>
    </SceneFrame>
  )
}
