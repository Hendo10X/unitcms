import React from "react"
import { useCurrentFrame } from "remotion"
import { C, mono, sans } from "../theme"
import { Card, DrawRect, Roll, SceneFrame, TextColumn, inOut, prog } from "../ui"

const DEVICES = 5

/** Config: change one value and watch every device pick it up in turn. */
export const Scene5: React.FC = () => {
  const f = useCurrentFrame()
  const count = prog(f, 86, 50, inOut)
  const value = Math.round((1500 + 500 * count) / 10) * 10
  const synced = 0.64 + 0.36 * count

  return (
    <SceneFrame>
      <TextColumn
        eyebrow="Remote config"
        lines={["One change.", "Every device."]}
        sub={["Edit a value and your app picks it up", "on the next refresh. No release."]}
      />

      <Card style={{ left: 1010, top: 130, width: 700, height: 400 }}>
        <div style={{ padding: "44px 52px", clipPath: `inset(0 ${(1 - prog(f, 10, 28)) * 100}% 0 0)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontFamily: mono, fontSize: 30, color: C.muted }}>delivery_fee</span>
            <span style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: C.blue, background: C.blueSoft, borderRadius: 999, padding: "6px 18px" }}>number</span>
          </div>
          <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 190, letterSpacing: "-0.06em", lineHeight: 1.05, color: C.fg, marginTop: 14, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, fontSize: 24, color: C.muted, marginBottom: 12 }}>
              <span>Synced</span>
              <span>{Math.round(synced * 100)}%</span>
            </div>
            <div style={{ height: 18, borderRadius: 9, background: "#f0f0ee" }}>
              <div style={{ height: "100%", width: `${synced * 100}%`, borderRadius: 9, background: C.blue }} />
            </div>
          </div>
        </div>
      </Card>

      <div style={{ position: "absolute", left: 1010, top: 600, width: 700, height: 300, display: "flex", justifyContent: "space-between" }}>
        {Array.from({ length: DEVICES }).map((_, i) => {
          const draw = prog(f, 26 + i * 5, 30, inOut)
          const t = prog(f, 100 + i * 9, 22, inOut)
          return (
            <div key={i} style={{ position: "relative", width: 118, height: 236 }}>
              <DrawRect w={118} h={236} r={30} t={draw} sw={2.5} />
              <div style={{ position: "absolute", left: 38, top: 12, width: 42, height: 12, borderRadius: 6, border: `2px solid ${C.blue}`, boxSizing: "border-box", opacity: draw > 0.9 ? 1 : 0 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center", clipPath: `inset(0 0 ${draw > 0.95 ? 0 : 100}% 0)` }}>
                <Roll
                  t={t}
                  height={50}
                  from={<span style={{ color: C.muted }}>1500</span>}
                  to={<span style={{ color: C.blue }}>2000</span>}
                  style={{ fontFamily: sans, fontWeight: 500, fontSize: 36, letterSpacing: "-0.04em", width: 118 }}
                />
              </div>
              <div style={{ position: "absolute", left: 50, top: 168, width: 18, height: 18, borderRadius: 9, background: t > 0.99 ? C.blue : C.track }} />
            </div>
          )
        })}
      </div>
    </SceneFrame>
  )
}
