"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { useResource, useStore } from "@/lib/store"
import type { Overview } from "@/lib/types"

export default function OverviewPage() {
  const { project, env } = useStore()
  const { data, loading, error } = useResource<{ data: Overview }>("/overview")
  const o = data?.data
  const series = o?.requests.series ?? []
  const max = Math.max(1, ...series.map((p) => p.count))

  const stats = [
    { label: "Requests (24h)", value: o?.requests.total.toLocaleString() },
    { label: "Content items", value: o?.entries.total, hint: o && `${o.entries.published} published` },
    { label: "Feature flags on", value: o && `${o.flags.enabled}/${o.flags.total}` },
    { label: "Config values", value: o?.config, hint: o && `${o.media} media files` },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${project?.name ?? ""} · ${env}. What your app is reading right now.`}
        action={
          <Button render={<Link href="/dashboard/content" />} nativeButton={false}>
            Manage content
          </Button>
        }
      />
      {error && <p className="mb-4 text-[14px] text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Panel key={s.label} className="p-5">
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
            <p className="mt-3 text-[40px] font-medium leading-none tracking-[-2px]">{loading && !o ? "–" : (s.value ?? 0)}</p>
            <p className="mt-2 h-4 text-[12px] text-muted-foreground">{s.hint}</p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium tracking-[-0.3px]">Requests</p>
          <span className="eyebrow">last 24 hours</span>
        </div>
        <div className="mt-8 flex h-36 items-end gap-1.5">
          {series.map((p) => (
            <div
              key={p.t}
              title={`${p.count} requests · ${new Date(p.t).toLocaleTimeString([], { hour: "numeric" })}`}
              className="flex-1 rounded-full bg-primary/15 transition-colors hover:bg-primary"
              style={{ height: `${Math.max(4, (p.count / max) * 100)}%` }}
            />
          ))}
        </div>
        {o && o.requests.total === 0 && (
          <p className="mt-6 text-[13px] text-muted-foreground">
            No requests yet. Fetch content with a delivery key to see traffic here.
          </p>
        )}
      </Panel>

      <Panel className="mt-3 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[15px] font-medium tracking-[-0.3px]">Connect your app</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Copy a delivery key and fetch your first entry.</p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard/api" />} nativeButton={false}>
          Get a key <ArrowUpRight />
        </Button>
      </Panel>
    </>
  )
}
