import React from "react"
import { Easing, interpolate, useCurrentFrame } from "remotion"
import { C, mono, sans } from "../theme"
import { Card, Eyebrow, Heading, Rise, SceneFrame, inOut, prog } from "../ui"

const LINES = [
  'const unit = Unit({ project: "proj_123", token: "unit_pub_..." })',
  'const articles = await unit.content("articles").list()',
]
const TOTAL = LINES.join("").length

/** Colours a typed prefix: keywords blue, strings green. */
function Code({ text }: { text: string }) {
  const parts = text.split(/("[^"]*"?|\b(?:const|await)\b)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.startsWith('"') ? C.green : /^(const|await)$/.test(p) ? C.blue : C.fg }}>
          {p}
        </span>
      ))}
    </>
  )
}

const stats = [
  ["< 5 min", "to first request"],
  ["0 lines", "of cache code"],
  ["3 sources", "network, cache, offline"],
]

/** The SDK: two lines of code, a typed result, and the numbers. */
export const Scene8: React.FC = () => {
  const f = useCurrentFrame()
  const typed = Math.floor(
    interpolate(f, [8, 78], [0, TOTAL], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear }),
  )
  const first = LINES[0].slice(0, typed)
  const second = typed > LINES[0].length ? LINES[1].slice(0, typed - LINES[0].length) : ""
  const swap = prog(f, 112, 16, inOut)

  return (
    <SceneFrame>
      <div style={{ position: "absolute", left: 360, top: 120, width: 1200 }}>
        <Eyebrow text="The SDK" start={2} />
        <div style={{ height: 24 }} />
        <Heading lines={["Zero to remote content", "in five minutes."]} start={6} size={84} />
      </div>

      <Card style={{ left: 360, top: 420, width: 1200, height: 210, overflow: "hidden" }}>
        <div style={{ padding: "40px 54px", fontFamily: mono, fontSize: 28, lineHeight: 1.9, whiteSpace: "pre" }}>
          <div style={{ color: C.muted, fontSize: 22 }}>content.ts</div>
          <div style={{ height: 14 }} />
          <div style={{ height: 54 }}>
            <Code text={first} />
          </div>
          <div style={{ height: 54 }}>
            <Code text={second} />
          </div>
        </div>
      </Card>

      <Card style={{ left: 360, top: 660, width: 1200, height: 120, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 54px",
            fontFamily: mono,
            fontSize: 28,
            color: C.muted,
            whiteSpace: "pre",
            clipPath: `inset(0 ${(1 - prog(f, 82, 26)) * 100}% 0 0)`,
          }}
        >
          {"{ data: [ ...10 articles ], meta: { source: "}
          <span style={{ display: "inline-block", height: 40, overflow: "hidden", verticalAlign: "top", lineHeight: "40px" }}>
            <span style={{ display: "block", transform: `translateY(${-swap * 40}px)`, color: C.blue }}>
              <span style={{ display: "block", height: 40 }}>"network"</span>
              <span style={{ display: "block", height: 40 }}>"cache"</span>
            </span>
          </span>
          {" } }"}
        </div>
      </Card>

      <div style={{ position: "absolute", left: 360, top: 830, width: 1200, display: "flex", justifyContent: "space-between" }}>
        {stats.map(([a, b], i) => (
          <Rise key={a} start={100 + i * 8} style={{ fontSize: 52 }}>
            <div>
              <div style={{ fontFamily: sans, fontWeight: 500, letterSpacing: "-0.05em", color: C.fg }}>{a}</div>
              <div style={{ fontFamily: sans, fontSize: 26, color: C.muted, letterSpacing: "-0.2px" }}>{b}</div>
            </div>
          </Rise>
        ))}
      </div>
    </SceneFrame>
  )
}
