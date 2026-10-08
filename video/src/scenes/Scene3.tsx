import React from "react"
import { useCurrentFrame } from "remotion"
import { C, mono } from "../theme"
import { DrawRect, SceneFrame, Tag, TextColumn, inOut, prog } from "../ui"

const PHONE = { x: 1190, y: 180, w: 360, h: 720 }

const box: React.CSSProperties = {
  background: "#fff",
  border: `2.5px solid ${C.blue}`,
  borderRadius: 26,
  boxSizing: "border-box",
}

const bar = (w: string, color: string): React.CSSProperties => ({ height: 12, width: w, borderRadius: 6, background: color })

type LayerDef = {
  key: string
  top: number
  h: number
  /** where it flies to: x, y, rotation */
  to: [number, number, number]
  tag: string
  tagPos: React.CSSProperties
  body: React.ReactNode
}

const layers: LayerDef[] = [
  {
    key: "cache",
    top: 92,
    h: 86,
    to: [-335, 300, 4],
    tag: "Cache",
    tagPos: { left: -10, bottom: -22 },
    body: (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 16px", height: "100%" }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: C.blueSoft, display: "grid", placeItems: "center" }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.blue }} />
        </div>
        <div style={{ fontFamily: mono, fontSize: 17, color: C.blue, lineHeight: 1.6 }}>
          source: cache
          <div style={{ color: C.blueMid }}>revalidating…</div>
        </div>
      </div>
    ),
  },
  {
    key: "content",
    top: 196,
    h: 232,
    to: [-335, -120, -4],
    tag: "Content",
    tagPos: { left: -10, top: -22 },
    body: (
      <div style={{ padding: 16 }}>
        <div style={{ height: 112, borderRadius: 16, background: C.blueSoft }} />
        <div style={{ height: 18 }} />
        <div style={bar("80%", "#c4d3ff")} />
        <div style={{ height: 12 }} />
        <div style={bar("60%", "#dfe7ff")} />
        <div style={{ height: 12 }} />
        <div style={bar("40%", "#dfe7ff")} />
      </div>
    ),
  },
  {
    key: "config",
    top: 446,
    h: 120,
    to: [262, -140, 3],
    tag: "Config",
    tagPos: { right: -10, top: -22 },
    body: (
      <div style={{ padding: "16px 18px", fontFamily: mono, fontSize: 16, color: C.blue, lineHeight: 1.9 }}>
        {[
          ["maintenance_mode", "false"],
          ["delivery_fee", "1500"],
          ["min_version", "2.4.0"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "flags",
    top: 584,
    h: 108,
    to: [262, 50, -3],
    tag: "Flags",
    tagPos: { right: -10, bottom: -22 },
    body: (
      <div style={{ padding: "16px 18px", fontFamily: mono, fontSize: 16, color: C.blue, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          ["new_checkout", true],
          ["map_tracking", false],
        ].map(([k, on]) => (
          <div key={k as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{k as string}</span>
            <div style={{ width: 46, height: 26, borderRadius: 13, background: on ? C.blue : C.track, position: "relative" }}>
              <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff" }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

/** The hero animation: one phone separates into its content, config, flags and cache layers. */
export const Scene3: React.FC = () => {
  const f = useCurrentFrame()
  return (
    <SceneFrame>
      <TextColumn eyebrow="One system" lines={["Everything your", "app reads."]} sub={["Content, config, flags and cache.", "Together, in one place."]} />

      <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h }}>
        <DrawRect w={PHONE.w} h={PHONE.h} r={64} t={prog(f, 0, 36, inOut)} />
        <div style={{ position: "absolute", left: (PHONE.w - 124) / 2, top: 18, width: 124, height: 38 }}>
          <DrawRect w={124} h={38} r={19} t={prog(f, 14, 24, inOut)} sw={2} />
        </div>

        {layers.map((L, i) => {
          const out = prog(f, 66 + i * 6, 52, inOut)
          const back = prog(f, 178 + i * 4, 44, inOut)
          const t = out - back
          const appear = prog(f, 24 + i * 6, 26)
          return (
            <div
              key={L.key}
              style={{
                position: "absolute",
                left: 29,
                top: L.top,
                width: 302,
                height: L.h,
                transform: `translate(${L.to[0] * t}px, ${L.to[1] * t}px) rotate(${L.to[2] * t}deg)`,
              }}
            >
              <div style={{ ...box, width: "100%", height: "100%", clipPath: `inset(0 0 ${(1 - appear) * 100}% 0)` }}>{L.body}</div>
              <div style={{ position: "absolute", ...L.tagPos }}>
                <Tag text={L.tag} t={prog(f, 96 + i * 5, 14) * (1 - back)} />
              </div>
            </div>
          )
        })}
      </div>
    </SceneFrame>
  )
}
