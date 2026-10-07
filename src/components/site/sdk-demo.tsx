"use client"

import { useEffect, useState } from "react"
import { CodeBlock } from "@/components/code-block"
import { cn } from "@/lib/utils"

const tabs = {
  content: {
    code: `import { Unit } from "@unitcms/react-native"

const unit = Unit({ project: "proj_123", token: "unit_pub_..." })

const articles = await unit.content("articles").list({ limit: 10 })`,
    result: (s: string) => `{ data: [ ...10 articles ], meta: { source: "${s}" } }`,
  },
  config: {
    code: `const config = await unit.config.get()

if (config.maintenance_mode) {
  showMaintenanceScreen()
}

const fee = config.delivery_fee // 1500`,
    result: (s: string) => `{ delivery_fee: 1500, maintenance_mode: false, meta: { source: "${s}" } }`,
  },
  flags: {
    code: `const enabled = unit.flag("new_checkout")

return enabled ? <NewCheckout /> : <Checkout />`,
    result: (s: string) => `true  // flag "new_checkout", source: "${s}"`,
  },
} as const

type Tab = keyof typeof tabs
const sources = ["network", "cache", "offline"] as const

export function SdkDemo() {
  const [tab, setTab] = useState<Tab>("content")
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % sources.length), 2200)
    return () => clearInterval(t)
  }, [])

  const t = tabs[tab]
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-4 inline-flex rounded-full bg-white p-1">
        {(Object.keys(tabs) as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] capitalize transition-colors",
              tab === k ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <CodeBlock code={t.code} title={`${tab}.ts`} />

      <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 text-left font-mono text-[12px]">
        <span className="min-w-0 truncate text-muted-foreground">{t.result(sources[i])}</span>
        <span className="tag shrink-0">{sources[i]}</span>
      </div>
    </div>
  )
}
