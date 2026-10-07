"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { useConfirm } from "@/components/dashboard/confirm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorMessage } from "@/lib/api"
import { useResource, useStore } from "@/lib/store"
import type { ConfigItem, ConfigType } from "@/lib/types"

const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v))

/** Parses what's typed into the right JS value, or throws a readable error. */
function parse(type: ConfigType, text: string): unknown {
  if (type === "string") return text
  if (type === "number") {
    const n = Number(text)
    if (text.trim() === "" || !Number.isFinite(n)) throw new Error("Enter a number")
    return n
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Enter valid JSON")
  }
}

function Row({ item, onChanged }: { item: ConfigItem; onChanged: () => void }) {
  const { admin } = useStore()
  const confirm = useConfirm()
  const [text, setText] = useState(show(item.value))
  const dirty = text !== show(item.value)

  const put = async (value: unknown) => {
    try {
      await admin(`/config/${item.key}`, { method: "PUT", json: { type: item.type, value } })
      toast.success(`${item.key} updated`)
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-background">
      <div className="w-[200px] shrink-0">
        <p className="font-mono text-[13px]">{item.key}</p>
        <p className="mt-0.5 text-[12px] capitalize text-muted-foreground">{item.type}</p>
      </div>
      <div className="min-w-[200px] flex-1">
        {item.type === "boolean" ? (
          <Switch checked={item.value === true} onCheckedChange={(c) => put(c)} />
        ) : (
          <Input value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-base md:text-[13px]" />
        )}
      </div>
      {item.type !== "boolean" && (
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            try { put(parse(item.type, text)) } catch (e) { toast.error((e as Error).message) }
          }}
        >
          Save
        </Button>
      )}
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Delete"
        onClick={async () => {
          const ok = await confirm({
            title: `Delete ${item.key}?`,
            description: "Apps that read this value will no longer receive it.",
            confirmLabel: "Delete",
            destructive: true,
          })
          if (!ok) return
          try { await admin(`/config/${item.key}`, { method: "DELETE" }); onChanged() } catch (e) { toast.error(errorMessage(e)) }
        }}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export default function ConfigPage() {
  const { admin, env } = useStore()
  const { data, loading, error, reload } = useResource<{ data: ConfigItem[] }>("/config")
  const [key, setKey] = useState("")
  const [type, setType] = useState<ConfigType>("string")
  const items = data?.data ?? []

  const add = async () => {
    const k = key.trim().replace(/\s+/g, "_")
    if (!k) return
    if (items.some((c) => c.key === k)) return toast.error("That key already exists")
    const value = type === "boolean" ? false : type === "number" ? 0 : type === "json" ? {} : ""
    try {
      await admin(`/config/${k}`, { method: "PUT", json: { type, value } })
      setKey("")
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader title="Config" description={`Typed values your app reads at runtime. Editing ${env}. Devices pick up changes on their next refresh.`} />
      {error && <p className="mb-3 text-[14px] text-destructive">{error}</p>}
      <Panel className="p-2">
        {items.map((c) => (
          // Remount when the stored value or environment changes so the input resets.
          <Row key={`${env}-${c.key}-${show(c.value)}`} item={c} onChanged={reload} />
        ))}
        {!loading && items.length === 0 && <p className="p-10 text-center text-[14px] text-muted-foreground">No values yet.</p>}
      </Panel>

      <Panel className="mt-3 flex flex-wrap items-center gap-3 p-4">
        <Input placeholder="new_key" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="max-w-[260px] flex-1 font-mono text-base md:text-[13px]" />
        <Select value={type} onValueChange={(v) => v && setType(v as ConfigType)}>
          <SelectTrigger className="w-[130px] capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["string", "number", "boolean", "json"] as const).map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={add}><Plus /> Add value</Button>
      </Panel>
    </>
  )
}
