import React from "react"
import { useCurrentFrame } from "remotion"
import { C, mono, sans } from "../theme"
import { Card, Roll, SceneFrame, Switch, TextColumn, inOut, prog } from "../ui"

const flags = [
  { key: "new_home", from: 1, to: 0, at: 96 },
  { key: "new_profile", from: 0, to: 1, at: 116 },
  { key: "map_tracking", from: 0, to: 1, at: 136 },
]

/** Feature flags: a headline flag rolls ON to OFF while the list switches flip in sequence. */
export const Scene6: React.FC = () => {
  const f = useCurrentFrame()
  const roll = prog(f, 72, 22, inOut)
  const swHead = prog(f, 72, 20, inOut)

  return (
    <SceneFrame>
      <TextColumn eyebrow="Feature flags" lines={["Switch features", "on and off."]} sub={["Per environment, instantly,", "from the dashboard."]} />

      <Card style={{ left: 1010, top: 130, width: 700, height: 820 }}>
        <div style={{ padding: "52px 60px 0", clipPath: `inset(0 ${(1 - prog(f, 8, 28)) * 100}% 0 0)` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 30, color: C.muted }}>new_checkout</div>
              <div style={{ fontFamily: sans, fontSize: 26, color: C.muted, marginTop: 8 }}>boolean · all users</div>
            </div>
            <Switch t={1 - swHead} scale={1.3} />
          </div>
          <div style={{ marginTop: 26, fontFamily: sans, fontWeight: 500, fontSize: 230, letterSpacing: "-0.06em", color: C.fg }}>
            <Roll
              t={roll}
              height={250}
              from={<span>ON</span>}
              to={<span style={{ color: C.muted }}>OFF</span>}
              style={{ width: 560 }}
            />
          </div>
        </div>

        <div style={{ position: "absolute", left: 28, right: 28, top: 470 }}>
          {flags.map((fl, i) => {
            const t = prog(f, fl.at, 20, inOut)
            const v = fl.from + (fl.to - fl.from) * t
            const reveal = prog(f, 26 + i * 8, 26)
            return (
              <div
                key={fl.key}
                style={{
                  height: 110,
                  padding: "0 32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 28,
                  background: i === 1 ? "#fafafa" : "transparent",
                  clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 32, color: C.fg }}>{fl.key}</span>
                <Switch t={v} />
              </div>
            )
          })}
        </div>
      </Card>
    </SceneFrame>
  )
}
