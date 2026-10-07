"use client"

import { useState } from "react"
import { motion, type Variants } from "motion/react"

const spring = { type: "spring", stiffness: 140, damping: 18 } as const

const layer = (x: number, y: number, r: number, delay: number): Variants => ({
  closed: { x: 0, y: 0, rotate: 0, transition: { ...spring, delay: 0 } },
  open: { x, y, rotate: r, transition: { ...spring, delay } },
})

const tagV: Variants = {
  closed: { opacity: 0, scale: 0.8 },
  open: { opacity: 1, scale: 1, transition: { delay: 0.25, duration: 0.3 } },
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span variants={tagV} className={`tag absolute whitespace-nowrap ${className ?? ""}`}>
      {children}
    </motion.span>
  )
}

const L = "border-[1.2px] border-[color:var(--line)]"

export function ExplodePhone() {
  const [open, setOpen] = useState(false)
  const state = open ? "open" : "closed"

  return (
    <div
      className="relative mx-auto h-[560px] w-full max-w-[760px] cursor-pointer select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      role="img"
      aria-label="Wireframe of a mobile app that separates into content, config, flags and cache layers on hover"
    >
      <div className="absolute inset-0 flex scale-[0.62] items-center justify-center sm:scale-100">
        {/* base screen */}
        <motion.div animate={state} initial="closed" className="relative">
          <div className={`relative h-[500px] w-[250px] rounded-[42px] ${L} bg-[#fafafa]/80`}>
            <div className={`absolute left-1/2 top-3 h-6 w-20 -translate-x-1/2 rounded-full ${L}`} />
          </div>

          {/* content layer */}
          <motion.div
            variants={layer(-310, -100, -4, 0.02)}
            className={`absolute left-5 top-[132px] w-[210px] rounded-2xl ${L} bg-white p-3`}
          >
            <div className={`h-20 rounded-xl ${L} bg-primary/5`} />
            <div className="mt-3 h-2 w-4/5 rounded bg-primary/30" />
            <div className="mt-2 h-2 w-3/5 rounded bg-primary/15" />
            <div className="mt-2 h-2 w-2/5 rounded bg-primary/15" />
            <Tag className="-left-2 -top-3">Content</Tag>
          </motion.div>

          {/* config layer */}
          <motion.div
            variants={layer(285, -120, 3, 0.06)}
            className={`absolute left-5 top-[300px] w-[210px] space-y-1.5 rounded-2xl ${L} bg-white p-3 font-mono text-[10px] text-primary`}
          >
            <div className="flex justify-between"><span>maintenance_mode</span><span>false</span></div>
            <div className="flex justify-between"><span>delivery_fee</span><span>1500</span></div>
            <div className="flex justify-between"><span>min_version</span><span>2.4.0</span></div>
            <Tag className="-right-2 -top-3">Config</Tag>
          </motion.div>

          {/* flags layer */}
          <motion.div
            variants={layer(300, 40, -3, 0.1)}
            className={`absolute left-5 top-[392px] w-[210px] space-y-2 rounded-2xl ${L} bg-white p-3 font-mono text-[10px] text-primary`}
          >
            {[["new_checkout", true], ["map_tracking", false]].map(([k, on]) => (
              <div key={k as string} className="flex items-center justify-between">
                <span>{k as string}</span>
                <span className={`h-3.5 w-7 rounded-full ${L} p-[2px]`}>
                  <span className={`block size-2.5 rounded-full bg-primary ${on ? "ml-3.5" : "opacity-30"}`} />
                </span>
              </div>
            ))}
            <Tag className="-right-2 -bottom-3">Flags</Tag>
          </motion.div>

          {/* cache layer */}
          <motion.div
            variants={layer(-290, 175, 4, 0.14)}
            className={`absolute left-5 top-[64px] flex w-[210px] items-center gap-3 rounded-2xl ${L} bg-white p-3`}
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary/10">
              <span className="size-3 rounded-full bg-primary" />
            </span>
            <div className="space-y-1.5 font-mono text-[10px] text-primary">
              <div>source: cache</div>
              <div className="opacity-50">revalidating…</div>
            </div>
            <Tag className="-left-2 -bottom-3">Cache</Tag>
          </motion.div>
        </motion.div>
      </div>
      <p className="eyebrow absolute inset-x-0 bottom-0 text-center">
        {open ? "Content · Config · Flags · Cache" : "Hover to take it apart"}
      </p>
    </div>
  )
}
