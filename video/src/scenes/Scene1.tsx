import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { C, sans } from "../theme"
import { LogoMark, Rise, SceneFrame, inOut, prog } from "../ui"

/** Logo: the dotted cube draws on, the blue cube spins once, then the name rises in. */
export const Scene1: React.FC = () => {
  const f = useCurrentFrame()
  return (
    <SceneFrame>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <LogoMark size={270} reveal={prog(f, 0, 26)} inner={prog(f, 12, 28)} rotate={prog(f, 34, 62, inOut) * 360} />
          <Rise start={32} dur={26} style={{ fontSize: 190, lineHeight: 1.05 }}>
            <span style={{ fontFamily: sans, fontWeight: 500, letterSpacing: "-0.0514em", color: C.fg }}>UnitCMS</span>
          </Rise>
        </div>
        <div style={{ height: 52 }} />
        <Rise start={62} style={{ fontSize: 50, lineHeight: 1.3 }}>
          <span style={{ fontFamily: sans, color: C.muted, letterSpacing: "-0.2px" }}>The content and configuration backend for mobile apps.</span>
        </Rise>
      </AbsoluteFill>
    </SceneFrame>
  )
}
