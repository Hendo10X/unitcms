import React from "react"
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion"
import { C, mono, sans } from "./theme"

/* Motion helpers ------------------------------------------------------ */

/** Smooth, no overshoot: fast start, long soft landing. */
export const ease = Easing.bezier(0.22, 1, 0.36, 1)
export const inOut = Easing.bezier(0.65, 0, 0.35, 1)

/** 0 → 1 between `start` and `start + dur`. */
export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = ease) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  })

/* Text ---------------------------------------------------------------- */

/** Slides its content up out of a mask. No opacity change at all. */
export const Rise: React.FC<{
  start: number
  dur?: number
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ start, dur = 24, children, style }) => {
  const f = useCurrentFrame()
  const t = prog(f, start, dur)
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.16em", marginBottom: "-0.16em", ...style }}>
      <div style={{ transform: `translateY(${(1 - t) * 118}%)` }}>{children}</div>
    </div>
  )
}

export const Heading: React.FC<{
  lines: string[]
  start: number
  size?: number
  color?: string
  align?: "left" | "center"
  stagger?: number
}> = ({ lines, start, size = 104, color = C.fg, align = "left", stagger = 7 }) => (
  <div style={{ textAlign: align }}>
    {lines.map((l, i) => (
      <Rise key={l} start={start + i * stagger} style={{ fontSize: size, lineHeight: 1.02 }}>
        <span style={{ fontFamily: sans, fontWeight: 500, letterSpacing: "-0.0514em", color, whiteSpace: "nowrap" }}>{l}</span>
      </Rise>
    ))}
  </div>
)

export const Sub: React.FC<{ lines: string[]; start: number; size?: number; color?: string; align?: "left" | "center" }> = ({
  lines,
  start,
  size = 38,
  color = C.muted,
  align = "left",
}) => (
  <div style={{ textAlign: align }}>
    {lines.map((l, i) => (
      <Rise key={l} start={start + i * 6} style={{ fontSize: size, lineHeight: 1.32 }}>
        <span style={{ fontFamily: sans, letterSpacing: "-0.2px", color, whiteSpace: "nowrap" }}>{l}</span>
      </Rise>
    ))}
  </div>
)

export const Eyebrow: React.FC<{ text: string; start: number; color?: string }> = ({ text, start, color = C.muted }) => (
  <Rise start={start} style={{ fontSize: 30 }}>
    <span style={{ fontFamily: sans, fontWeight: 500, letterSpacing: "-0.1px", color, display: "inline-flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: C.blue, display: "inline-block" }} />
      {text}
    </span>
  </Rise>
)

/** The left-hand text column used by the feature scenes. */
export const TextColumn: React.FC<{ eyebrow: string; lines: string[]; sub: string[] }> = ({ eyebrow, lines, sub }) => (
  <div style={{ position: "absolute", left: 200, top: 0, bottom: 0, width: 760, display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Eyebrow text={eyebrow} start={4} />
    <div style={{ height: 34 }} />
    <Heading lines={lines} start={10} size={96} />
    <div style={{ height: 40 }} />
    <Sub lines={sub} start={30} />
  </div>
)

/** Value that rolls up out of a mask, like a split-flap. */
export const Roll: React.FC<{
  from: React.ReactNode
  to: React.ReactNode
  t: number
  height: number
  style?: React.CSSProperties
}> = ({ from, to, t, height, style }) => (
  <div style={{ display: "inline-block", height, overflow: "hidden", lineHeight: `${height}px`, verticalAlign: "top", ...style }}>
    <div style={{ transform: `translateY(${-t * height}px)` }}>
      <div style={{ height }}>{from}</div>
      <div style={{ height }}>{to}</div>
    </div>
  </div>
)

/* Wireframe pieces ----------------------------------------------------- */

export const Rails: React.FC<{ color?: string }> = ({ color = C.dot }) => (
  <>
    <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, borderLeft: `3px dotted ${color}` }} />
    <div style={{ position: "absolute", left: 1800, top: 0, bottom: 0, borderLeft: `3px dotted ${color}` }} />
  </>
)

export const SceneFrame: React.FC<{ children: React.ReactNode; bg?: string; railColor?: string }> = ({ children, bg = C.bg, railColor }) => (
  <AbsoluteFill style={{ background: bg, fontFamily: sans, overflow: "hidden" }}>
    <Rails color={railColor} />
    {children}
  </AbsoluteFill>
)

/** A rounded outline that draws itself on. */
export const DrawRect: React.FC<{ w: number; h: number; r: number; t: number; sw?: number; color?: string }> = ({
  w,
  h,
  r,
  t,
  sw = 2.5,
  color = C.blue,
}) => (
  <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <rect
      x={sw / 2}
      y={sw / 2}
      width={w - sw}
      height={h - sw}
      rx={r}
      ry={r}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - t}
    />
  </svg>
)

export const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", background: C.card, borderRadius: 40, ...style }}>{children}</div>
)

export const Switch: React.FC<{ t: number; scale?: number }> = ({ t, scale = 1 }) => (
  <div
    style={{
      width: 76 * scale,
      height: 44 * scale,
      borderRadius: 999,
      background: interpolateColors(t, [0, 1], [C.track, C.blue]),
      position: "relative",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 4 * scale,
        left: 4 * scale,
        width: 36 * scale,
        height: 36 * scale,
        borderRadius: 999,
        background: "#fff",
        transform: `translateX(${t * 32 * scale}px)`,
      }}
    />
  </div>
)

/** Blue label that grows out from its left edge. */
export const Tag: React.FC<{ text: string; t: number; size?: number }> = ({ text, t, size = 20 }) => (
  <div
    style={{
      background: C.blue,
      color: "#fff",
      fontFamily: sans,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: `${size * 0.4}px ${size * 0.9}px`,
      borderRadius: 6,
      transform: `scaleX(${t})`,
      transformOrigin: "left center",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
)

export const Hex: React.FC<{ size: number; color?: string }> = ({ size, color = C.blue }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2l9 5v10l-9 5-9-5V7z" fill={color} />
  </svg>
)

/* Logo ------------------------------------------------------------------ */

const hex = (r: number) => {
  const dx = r * 0.866
  const dy = r / 2
  return {
    top: [16, 16 - r],
    ur: [16 + dx, 16 - dy],
    lr: [16 + dx, 16 + dy],
    bottom: [16, 16 + r],
    ll: [16 - dx, 16 + dy],
    ul: [16 - dx, 16 - dy],
    c: [16, 16],
  }
}
const pts = (...p: number[][]) => p.map((q) => q.join(",")).join(" ")

export const LogoMark: React.FC<{ size: number; reveal?: number; inner?: number; rotate?: number; light?: boolean }> = ({
  size,
  reveal = 1,
  inner = 1,
  rotate = 0,
  light = false,
}) => {
  const o = hex(14)
  const i = hex(9.5)
  const line = light ? "#ffffff" : C.fg
  const faces = light ? ["#ffffff", "rgba(255,255,255,0.78)", "rgba(255,255,255,0.55)"] : [C.blueMid, C.blue, C.blueDark]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ overflow: "visible", clipPath: `circle(${reveal * 75}% at 50% 50%)` }}>
      <g fill="none" stroke={line} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 3">
        <polygon points={pts(o.top, o.ur, o.lr, o.bottom, o.ll, o.ul)} strokeLinejoin="round" />
        <polyline points={pts(o.ul, o.c, o.ur)} />
        <line x1={o.c[0]} y1={o.c[1]} x2={o.bottom[0]} y2={o.bottom[1]} />
      </g>
      <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: `rotate(${rotate}deg) scale(${inner})` }}>
        <polygon points={pts(i.top, i.ur, i.c, i.ul)} fill={faces[0]} />
        <polygon points={pts(i.ul, i.c, i.bottom, i.ll)} fill={faces[1]} />
        <polygon points={pts(i.ur, i.lr, i.bottom, i.c)} fill={faces[2]} />
      </g>
    </svg>
  )
}

/* Scene change ---------------------------------------------------------- */

/** A solid blue panel sweeping across the screen. It hides the cut between two scenes. */
export const Wipe: React.FC<{ at: number; half?: number; color?: string }> = ({ at, half = 14, color = C.blue }) => {
  const f = useCurrentFrame()
  if (f < at - half || f > at + half) return null
  const x = f <= at ? -100 + 100 * prog(f, at - half, half, inOut) : 100 * prog(f, at, half, inOut)
  return <AbsoluteFill style={{ background: color, transform: `translateX(${x}%)` }} />
}

export const monoStyle: React.CSSProperties = { fontFamily: mono }
