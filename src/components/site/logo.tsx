"use client"

import Link from "next/link"
import { motion } from "motion/react"

// Isometric cube corners for a given radius around (16, 16).
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

export function LogoMark({ size = 40 }: { size?: number }) {
  const o = hex(14)
  const i = hex(6.5)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0 overflow-visible">
      {/* outer cube, dotted */}
      <g fill="none" stroke="#101010" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 3">
        <polygon points={pts(o.top, o.ur, o.lr, o.bottom, o.ll, o.ul)} strokeLinejoin="round" />
        <polyline points={pts(o.ul, o.c, o.ur)} />
        <line x1={o.c[0]} y1={o.c[1]} x2={o.bottom[0]} y2={o.bottom[1]} />
      </g>
      {/* inner blue cube, revolves once on load */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <polygon points={pts(i.top, i.ur, i.c, i.ul)} fill="#6f94ff" />
        <polygon points={pts(i.ul, i.c, i.bottom, i.ll)} fill="#1a56ff" />
        <polygon points={pts(i.ur, i.lr, i.bottom, i.c)} fill="#0f3fd1" />
      </motion.g>
    </svg>
  )
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[17px] font-medium tracking-[-0.5px]">
      <LogoMark />
      UnitCMS
    </Link>
  )
}
