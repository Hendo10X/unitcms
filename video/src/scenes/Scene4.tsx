import React from "react"
import { useCurrentFrame } from "remotion"
import { C, mono, sans } from "../theme"
import { Card, Roll, SceneFrame, Switch, TextColumn, inOut, prog } from "../ui"

const rows = [
  { title: "Welcome to UnitCMS", meta: "articles · article_b907e3", on: true },
  { title: "Our new checkout", meta: "articles · article_ce4884", on: false },
  { title: "Free delivery weekend", meta: "banners · banner_293e9c", on: true },
]

/** Content: one switch moves an entry from draft to live, and the API count follows. */
export const Scene4: React.FC = () => {
  const f = useCurrentFrame()
  const flip = prog(f, 92, 20, inOut)

  return (
    <SceneFrame>
      <TextColumn eyebrow="Content" lines={["Draft it.", "Publish it."]} sub={["Only published entries reach your app.", "Flip the switch when you are ready."]} />

      <Card style={{ left: 1010, top: 150, width: 700, height: 480 }}>
        {rows.map((r, i) => {
          const reveal = prog(f, 14 + i * 8, 26)
          const t = i === 1 ? flip : 1
          return (
            <div
              key={r.title}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 28 + i * 142,
                height: 124,
                padding: "0 44px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 38, letterSpacing: "-0.04em", color: C.fg, whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ fontFamily: sans, fontSize: 24, color: C.muted, marginTop: 6 }}>{r.meta}</div>
              </div>
              <div style={{ width: 140, textAlign: "right", fontFamily: sans, fontSize: 26, fontWeight: 500 }}>
                {i === 1 ? (
                  <Roll
                    t={flip}
                    height={40}
                    from={<span style={{ color: C.muted }}>Draft</span>}
                    to={<span style={{ color: C.blue }}>Published</span>}
                    style={{ width: 140 }}
                  />
                ) : (
                  <span style={{ color: C.blue }}>Published</span>
                )}
              </div>
              <Switch t={t} />
            </div>
          )
        })}
      </Card>

      <Card style={{ left: 1010, top: 672, width: 700, height: 220, background: "#fff" }}>
        <div style={{ padding: "34px 44px", fontFamily: mono, fontSize: 22, lineHeight: 1.7, color: C.muted }}>
          <div style={{ color: C.blue, whiteSpace: "nowrap" }}>GET /v1/projects/proj_123/content/articles</div>
          <div style={{ marginTop: 10, color: C.fg, whiteSpace: "nowrap" }}>
            {`{ "data": [ … ], "meta": { "count": `}
            <Roll from={<span>2</span>} to={<span style={{ color: C.blue }}>3</span>} t={prog(f, 108, 18, inOut)} height={46} style={{ width: 18 }} />
            {` } }`}
          </div>
        </div>
      </Card>
    </SceneFrame>
  )
}
