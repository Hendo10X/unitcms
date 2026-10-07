"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, animate, motion, type Variants } from "motion/react"
import { Check, AlertTriangle, Database, Settings2, Flag } from "lucide-react"
import { Reveal } from "./reveal"
import { useHoverOrScroll } from "@/hooks/use-hover-or-scroll"

const spring = { type: "spring", stiffness: 160, damping: 20 } as const
const L = "border-[1.2px] border-[color:var(--line)]"

/* ------------------------------------------------------------------ */
/* Core feature cards                                                  */
/* ------------------------------------------------------------------ */

function Hex({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2l9 5v10l-9 5-9-5V7z" fill="var(--line)" />
    </svg>
  )
}

/** Plays its "hover" variants on hover (desktop) or when scrolled into view (phones). */
function HoverArt({ className, children }: { className?: string; children: React.ReactNode }) {
  const { ref, active, bind } = useHoverOrScroll()
  return (
    <motion.div ref={ref} {...bind} initial="rest" animate={active ? "hover" : "rest"} className={className}>
      {children}
    </motion.div>
  )
}

function ReadingArt() {
  return (
    <HoverArt className="relative h-full w-full">
      <div className={`absolute left-1/2 top-8 h-[300px] w-[190px] -translate-x-1/2 rounded-[30px] ${L} bg-white`}>
        <div className="mx-auto mt-3 h-4 w-14 rounded-full bg-primary/10" />
        <div className="mx-4 mt-5 space-y-2">
          <div className="h-16 rounded-xl bg-primary/5" />
          <div className="h-2 w-4/5 rounded bg-primary/20" />
          <div className="h-2 w-3/5 rounded bg-primary/10" />
          <div className="mt-4 h-2 w-full rounded bg-primary/10" />
          <div className="h-2 w-2/3 rounded bg-primary/10" />
        </div>
      </div>
      <motion.div
        variants={{
          rest: { x: 0, y: 0, scale: 1 },
          hover: { x: 18, y: 78, scale: 1.12, transition: spring },
        }}
        className={`absolute left-[calc(50%-80px)] top-14 h-[88px] w-[160px] rounded-sm ${L}`}
      />
      <motion.div
        variants={{ rest: { x: 0, y: 0 }, hover: { x: 52, y: 70, transition: spring } }}
        className="absolute left-[calc(50%+10px)] top-[88px]"
      >
        <Hex className="size-7" />
      </motion.div>
      <motion.div
        variants={{ rest: { x: 0, y: 0 }, hover: { x: 52, y: 70, transition: spring } }}
        className="absolute left-[calc(50%+30px)] top-[108px]"
      >
        <span className="tag relative block">
          <motion.span variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}>Reading</motion.span>
          <motion.span
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            className="absolute inset-0 grid place-items-center"
          >
            Synced
          </motion.span>
        </span>
      </motion.div>
    </HoverArt>
  )
}

function CacheArt() {
  return (
    <HoverArt className="relative h-full w-full">
      <div className={`absolute left-1/2 top-8 h-[300px] w-[210px] -translate-x-1/2 rounded-[36px] ${L}`}>
        <div className={`mx-auto mt-3 h-5 w-20 rounded-full ${L}`} />
      </div>
      <motion.div
        variants={{ rest: { rotate: 0 }, hover: { rotate: 180, transition: { duration: 1.4, ease: "easeInOut" } } }}
        className={`absolute left-1/2 top-[70px] size-[150px] -translate-x-1/2 rounded-full ${L}`}
      >
        <span className="absolute inset-3 rounded-full border-[1.2px] border-dashed border-[color:var(--line)]/50" />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <Hex className="size-5" />
        </span>
      </motion.div>
      <div className="absolute left-1/2 top-[137px] -translate-x-1/2">
        <span className="tag relative block">
          <motion.span variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}>Cached</motion.span>
          <motion.span
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            className="absolute inset-0 grid place-items-center"
          >
            Fresh
          </motion.span>
        </span>
      </div>
    </HoverArt>
  )
}

function LogArt() {
  return (
    <HoverArt className="relative h-full w-full px-6 pt-8">
      <div className={`rounded-2xl ${L} p-1.5 font-mono text-[11px] uppercase text-primary`}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5">
          <Check className="size-3.5" /> Fetch articles
        </div>
        <motion.div
          variants={{ rest: { y: 0 }, hover: { y: 12, transition: spring } }}
          className={`mt-1 rounded-xl ${L} bg-white px-3 py-3`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5" /> Network offline
          </div>
          <p className="mt-2 text-[10px] normal-case leading-relaxed">
            Served from cache. Content stays on screen and revalidates when you are back online.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
            <span className={`rounded-md ${L} px-2 py-1`}>source: cache</span>
            <span className={`rounded-md ${L} px-2 py-1`}>age: 4m</span>
          </div>
        </motion.div>
      </div>
    </HoverArt>
  )
}

const core = [
  {
    art: <ReadingArt />,
    title: "One SDK for everything",
    desc: "Content, remote config and feature flags behind a single client. No glue code.",
  },
  {
    art: <CacheArt />,
    title: "Cache first, always fresh",
    desc: "Render instantly from local storage, then revalidate quietly in the background.",
  },
  {
    art: <LogArt />,
    title: "Works without a network",
    desc: "Every response tells you whether it came from the network, the cache or offline.",
  },
]

export function CoreFeatures() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {core.map((c, i) => (
        <Reveal key={c.title} delay={i * 0.08}>
          <div className="flex h-full flex-col rounded-2xl bg-white p-3 text-center">
            <div className="relative h-[250px] overflow-hidden rounded-xl bg-background">{c.art}</div>
            <h3 className="mt-5 text-[19px] font-medium tracking-[-0.5px]">{c.title}</h3>
            <p className="mx-auto mb-3 mt-1.5 max-w-[260px] text-[15px] leading-snug text-muted-foreground">
              {c.desc}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Content / Config / Flags with a phone that falls apart              */
/* ------------------------------------------------------------------ */

function Bar({ w, tone = "bg-primary" }: { w: string; tone?: string }) {
  return (
    <div className="h-2.5 flex-1 rounded-full bg-secondary">
      <div className={`h-full rounded-full ${tone}`} style={{ width: w }} />
    </div>
  )
}

function Phone({ children, spread = false }: { children: React.ReactNode[]; spread?: boolean }) {
  return (
    <div className="relative mx-auto mt-12 h-[310px] w-[270px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
      <div className="absolute inset-x-0 top-0 h-[380px] rounded-t-[40px] border-[1.5px] border-b-0 border-[#e6e6e2] bg-white">
        <div className="mx-auto mt-3 h-5 w-24 rounded-full bg-secondary" />
        <div className="px-5 pt-5">
          {children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                rest: { y: 0 },
                hover: spread ? { y: i * 10, transition: { ...spring, delay: i * 0.03 } } : { y: 0 },
              }}
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Big = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-center text-[32px] font-medium leading-none tracking-[-1.5px]">{children}</p>
)

function Tiles({ items }: { items: string[] }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] text-muted-foreground">
      {items.map((t) => (
        <div key={t} className="rounded-xl bg-secondary py-2.5">{t}</div>
      ))}
    </div>
  )
}

function ContentPhone() {
  // Interaction 1: the screen falls apart into stacked layers.
  return (
    <Phone spread>
      {[
        <p key="a" className="text-center text-[11px]">Articles</p>,
        <Big key="b">128</Big>,
        <p key="c" className="mt-1 text-center text-[10px] text-muted-foreground">published entries</p>,
        <div key="d" className="mt-4 space-y-2 text-[9px]">
          <div className="flex items-center gap-2"><span className="w-12">Published</span><Bar w="82%" /></div>
          <div className="flex items-center gap-2"><span className="w-12">Draft</span><Bar w="24%" tone="bg-[#9db6ff]" /></div>
        </div>,
        <Tiles key="e" items={["Draft", "Publish", "Edit"]} />,
        <div key="f" className="mt-3 flex items-center gap-2 text-[10px]">
          <span className="size-6 rounded-md bg-primary/10" /> Welcome to UnitCMS
          <span className="ml-auto text-muted-foreground">Live</span>
        </div>,
      ]}
    </Phone>
  )
}

function ConfigPhone() {
  // Interaction 2: the value is edited remotely. The number counts up, the sync bar fills and the type tile lights up.
  const { ref, active: on, bind } = useHoverOrScroll()
  const [value, setValue] = useState(1500)

  useEffect(() => {
    const c = animate(value, on ? 2000 : 1500, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v / 10) * 10),
    })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  return (
    <div ref={ref} {...bind}>
      <Phone>
        {[
          <p key="a" className="text-center text-[11px]">delivery_fee</p>,
          <Big key="b"><span className="tabular-nums">{value}</span></Big>,
          <p key="c" className="mt-1 text-center text-[10px] text-muted-foreground">
            {on ? "synced to 12,480 devices" : "number · production"}
          </p>,
          <div key="d" className="mt-4 space-y-2 text-[9px]">
            <div className="flex items-center gap-2"><span className="w-12">Version</span><Bar w="100%" /></div>
            <div className="flex items-center gap-2">
              <span className="w-12">Synced</span>
              <div className="h-2.5 flex-1 rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: on ? "100%" : "64%" }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>,
          <div key="e" className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px]">
            {["String", "Number", "JSON"].map((t) => (
              <motion.div
                key={t}
                animate={{
                  backgroundColor: on && t === "Number" ? "#1a56ff" : "#f0f0ee",
                  color: on && t === "Number" ? "#ffffff" : "#8b8b86",
                }}
                className="rounded-xl py-2.5"
              >
                {t}
              </motion.div>
            ))}
          </div>,
          <div key="f" className="mt-3 flex items-center justify-between text-[10px]">
            <span>maintenance_mode</span><span className="text-muted-foreground">false</span>
          </div>,
        ]}
      </Phone>
    </div>
  )
}

function FlagsPhone() {
  // Interaction 3: flags flip. The headline rolls ON to OFF and every switch slides across.
  const { ref, active: flipped, bind } = useHoverOrScroll()
  const rows = [
    { k: "new_home", on: true },
    { k: "new_profile", on: false },
  ]
  const checkoutOn = !flipped
  const colors = ["#ff6b6b", "#ffb454", "#ffd84a", "#3dd68c", "#3dd68c"]

  return (
    <div ref={ref} {...bind}>
      <Phone>
        {[
          <p key="a" className="text-center text-[11px]">new_checkout</p>,
          <div key="b" className="relative mt-1 h-[32px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={checkoutOn ? "on" : "off"}
                initial={{ y: 32, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -32, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="text-center text-[32px] font-medium leading-none tracking-[-1.5px]"
              >
                {checkoutOn ? "ON" : "OFF"}
              </motion.p>
            </AnimatePresence>
          </div>,
          <p key="c" className="mt-1 text-center text-[10px] text-muted-foreground">boolean · all users</p>,
          <div key="d" className="mt-4 flex items-center gap-1">
            {colors.map((c, i) => (
              <motion.span
                key={i}
                className="h-2.5 flex-1 rounded-full"
                animate={{ backgroundColor: flipped ? "#e4e4e0" : c }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>,
          <div key="e" className="mt-4 space-y-2 text-[10px]">
            {rows.map(({ k, on }, i) => {
              const state = flipped ? !on : on
              return (
                <div key={k} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                  {k}
                  <motion.span
                    className="h-3.5 w-7 rounded-full p-[2px]"
                    animate={{ backgroundColor: state ? "#1a56ff" : "#d6d6d1" }}
                    transition={{ delay: 0.1 + i * 0.12 }}
                  >
                    <motion.span
                      className="block size-2.5 rounded-full bg-white"
                      animate={{ x: state ? 14 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26, delay: 0.1 + i * 0.12 }}
                    />
                  </motion.span>
                </div>
              )
            })}
          </div>,
        ]}
      </Phone>
    </div>
  )
}

const trio = [
  { icon: Database, title: "Content", desc: "Typed schemas, drafts and publishing. Only published entries reach the app.", phone: <ContentPhone /> },
  { icon: Settings2, title: "Remote config", desc: "Change strings, numbers, booleans and JSON without an app store release.", phone: <ConfigPhone /> },
  { icon: Flag, title: "Feature flags", desc: "Turn features on or off per environment, instantly, from the dashboard.", phone: <FlagsPhone /> },
]

export function Trio() {
  return (
    <div className="grid gap-x-6 gap-y-20 md:grid-cols-3">
      {trio.map((t, i) => (
        <Reveal key={t.title} delay={i * 0.08}>
          <HoverArt className="text-center">
            <t.icon className="mx-auto size-5 text-muted-foreground" strokeWidth={1.6} />
            <h3 className="mt-4 text-[22px] font-medium tracking-[-0.8px]">{t.title}</h3>
            <p className="mx-auto mt-2 max-w-[280px] text-[15px] leading-snug text-muted-foreground">{t.desc}</p>
            {t.phone}
          </HoverArt>
        </Reveal>
      ))}
    </div>
  )
}
