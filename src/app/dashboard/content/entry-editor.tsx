"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorMessage } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { ContentType, Entry, Field, MediaItem } from "@/lib/types"

type Values = Record<string, unknown>
const NONE = "__none__"

/** Turns the stored value into what the input shows. */
const toInput = (f: Field, v: unknown): unknown => {
  if (v === undefined || v === null) return f.type === "boolean" ? false : ""
  if (f.type === "list" || f.type === "object" || (f.type === "richText" && typeof v !== "string")) return JSON.stringify(v, null, 2)
  return v
}

/** Turns what the inputs hold into the API value. Returns `undefined` when the field is empty. */
function fromInput(f: Field, v: unknown): unknown {
  if (f.type === "boolean") return Boolean(v)
  if (v === "" || v === undefined || v === null) return undefined
  if (f.type === "number") {
    const n = Number(v)
    if (!Number.isFinite(n)) throw new Error(`${f.name} must be a number`)
    return n
  }
  if (f.type === "list" || f.type === "object") {
    try {
      const parsed = JSON.parse(String(v))
      if (f.type === "list" && !Array.isArray(parsed)) throw new Error()
      if (f.type === "object" && (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))) throw new Error()
      return parsed
    } catch {
      throw new Error(`${f.name} must be valid JSON ${f.type === "list" ? "(an array)" : "(an object)"}`)
    }
  }
  return v
}

export function EntryEditor({
  open,
  entry,
  types,
  media,
  defaultType,
  onClose,
  onSaved,
}: {
  open: boolean
  entry: Entry | null
  types: ContentType[]
  media: MediaItem[]
  defaultType?: string
  onClose: () => void
  onSaved: () => void
}) {
  const { admin } = useStore()
  const [typeName, setTypeName] = useState("")
  const [values, setValues] = useState<Values>({})
  const [busy, setBusy] = useState(false)

  const type = types.find((t) => t.name === typeName)

  useEffect(() => {
    if (!open) return
    const name = entry?.type ?? defaultType ?? types[0]?.name ?? ""
    const t = types.find((x) => x.name === name)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTypeName(name)
    setValues(Object.fromEntries((t?.fields ?? []).map((f) => [f.name, toInput(f, entry?.attributes[f.name])])))
  }, [open, entry, types, defaultType])

  const pickType = (name: string) => {
    const t = types.find((x) => x.name === name)
    setTypeName(name)
    setValues(Object.fromEntries((t?.fields ?? []).map((f) => [f.name, toInput(f, undefined)])))
  }

  async function save(publish: boolean) {
    if (!type) return
    setBusy(true)
    try {
      const data: Values = {}
      for (const f of type.fields) {
        const v = fromInput(f, values[f.name])
        if (v !== undefined) data[f.name] = v
        else if (entry) data[f.name] = null // clears the field on edit
      }
      let id = entry?.id
      if (entry) {
        await admin(`/entries/${entry.id}`, { method: "PATCH", json: { data } })
      } else {
        const res = await admin<{ data: Entry }>("/entries", { method: "POST", json: { type: type.name, data } })
        id = res.data.id
      }
      if (publish) await admin(`/entries/${id}/publish`, { method: "POST" })
      toast.success(publish ? "Published" : "Saved")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const set = (name: string, v: unknown) => setValues((cur) => ({ ...cur, [name]: v }))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[26px] tracking-[-1px]">{entry ? "Edit entry" : "New entry"}</DialogTitle>
          <DialogDescription>Drafts stay private. Required fields are checked when you publish.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!entry && (
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select value={typeName} onValueChange={(v) => v && pickType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.label} ({t.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type?.fields.length === 0 && <p className="text-[14px] text-muted-foreground">This type has no fields yet. Add some under Types.</p>}

          {type?.fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={`f-${f.name}`}>
                {f.name}
                {f.required && <span className="text-primary"> *</span>}
                <span className="ml-2 text-[12px] font-normal text-muted-foreground">{f.type}</span>
              </Label>
              <FieldInput f={f} value={values[f.name]} media={media} onChange={(v) => set(f.name, v)} />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-secondary" disabled={busy || !type} onClick={() => save(false)}>
            Save draft
          </Button>
          <Button disabled={busy || !type} onClick={() => save(true)}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldInput({ f, value, media, onChange }: { f: Field; value: unknown; media: MediaItem[]; onChange: (v: unknown) => void }) {
  const id = `f-${f.name}`
  switch (f.type) {
    case "boolean":
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
    case "longText":
    case "richText":
      return <Textarea id={id} rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
    case "list":
    case "object":
      return (
        <Textarea
          id={id}
          rows={4}
          className="font-mono text-[12px]"
          placeholder={f.type === "list" ? "[]" : "{}"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case "number":
      return <Input id={id} type="number" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
    case "date":
      return <Input id={id} type="datetime-local" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
    case "image":
    case "file": {
      const options = media.filter((m) => (f.type === "image" ? m.mimeType.startsWith("image/") : true))
      return (
        <Select value={(value as string) || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue>{options.find((m) => m.id === value)?.filename ?? "None"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {options.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case "reference":
      return <Input id={id} placeholder="entry id, e.g. article_ab12cd" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
    default:
      return <Input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
  }
}

function toLocal(v: unknown) {
  if (typeof v !== "string" || !v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
