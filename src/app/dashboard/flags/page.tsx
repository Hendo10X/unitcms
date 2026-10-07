"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { errorMessage } from "@/lib/api"
import { useResource, useStore } from "@/lib/store"
import type { Flag } from "@/lib/types"

export default function FlagsPage() {
  const { admin, env } = useStore()
  const { data, loading, error, reload } = useResource<{ data: Flag[] }>("/flags")
  const [key, setKey] = useState("")
  const [desc, setDesc] = useState("")
  const flags = data?.data ?? []

  const put = async (k: string, enabled: boolean, description?: string) => {
    try {
      await admin(`/flags/${k}`, { method: "PUT", json: { enabled, ...(description !== undefined ? { description } : {}) } })
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const add = async () => {
    const k = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
    if (!k) return
    if (flags.some((f) => f.key === k)) return toast.error("That flag already exists")
    await put(k, false, desc.trim())
    setKey("")
    setDesc("")
  }

  return (
    <>
      <PageHeader title="Feature flags" description={`Turn functionality on or off remotely. Editing ${env}. Flags are boolean in the MVP.`} />
      {error && <p className="mb-3 text-[14px] text-destructive">{error}</p>}
      <Panel className="p-2">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-background">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[13px]">{f.key}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{f.description || "No description"}</p>
            </div>
            <span className={`w-8 text-right text-[12px] font-medium ${f.enabled ? "text-primary" : "text-muted-foreground"}`}>{f.enabled ? "On" : "Off"}</span>
            <Switch checked={f.enabled} onCheckedChange={(c) => put(f.key, c)} />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete"
              onClick={async () => {
                try { await admin(`/flags/${f.key}`, { method: "DELETE" }); reload() } catch (e) { toast.error(errorMessage(e)) }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {!loading && flags.length === 0 && <p className="p-10 text-center text-[14px] text-muted-foreground">No flags yet.</p>}
      </Panel>
      <Panel className="mt-3 flex flex-wrap items-center gap-3 p-4">
        <Input placeholder="new_flag" value={key} onChange={(e) => setKey(e.target.value)} className="max-w-[220px] flex-1 font-mono text-base md:text-[13px]" />
        <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="min-w-[200px] flex-1" />
        <Button onClick={add}><Plus /> Add flag</Button>
      </Panel>
    </>
  )
}
