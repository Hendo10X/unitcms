"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Panel } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorMessage } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { ContentType, Field, FieldType } from "@/lib/types"

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "longText", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
  { value: "richText", label: "Rich text" },
  { value: "reference", label: "Reference" },
  { value: "list", label: "List" },
  { value: "object", label: "Object" },
]

type Draft = { existing: boolean; name: string; label: string; fields: Field[] }

export function TypesPanel({ types, onChanged }: { types: ContentType[]; onChanged: () => void }) {
  const { admin } = useStore()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)

  const open = (t?: ContentType) =>
    setDraft(t ? { existing: true, name: t.name, label: t.label, fields: t.fields } : { existing: false, name: "", label: "", fields: [{ name: "title", type: "text", required: true }] })

  async function save() {
    if (!draft) return
    setBusy(true)
    try {
      const fields = draft.fields.filter((f) => f.name.trim()).map((f) => ({ ...f, name: f.name.trim() }))
      if (draft.existing) {
        await admin(`/types/${draft.name}`, { method: "PUT", json: { label: draft.label, fields } })
      } else {
        await admin("/types", { method: "POST", json: { name: draft.name, label: draft.label, fields } })
      }
      toast.success("Type saved")
      setDraft(null)
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function remove(t: ContentType) {
    if (!window.confirm(`Delete "${t.label}" and every entry of this type, in all environments? This can't be undone.`)) return
    try {
      await admin(`/types/${t.name}`, { method: "DELETE" })
      toast("Type deleted")
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const setField = (i: number, patch: Partial<Field>) =>
    setDraft((d) => d && { ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) })

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open()}>
          <Plus /> New type
        </Button>
      </div>
      <Panel className="p-2">
        {types.length === 0 && (
          <p className="p-10 text-center text-[14px] text-muted-foreground">No content types yet. Create one to start adding content.</p>
        )}
        {types.map((t) => (
          <div key={t.id} className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-background">
            <button onClick={() => open(t)} className="min-w-0 flex-1 text-left">
              <p className="text-[15px] font-medium tracking-[-0.3px]">{t.label}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                {t.name} · {t.fields.map((f) => f.name).join(", ") || "no fields"}
              </p>
            </button>
            <Button size="icon-sm" variant="ghost" aria-label={`Delete ${t.label}`} onClick={() => remove(t)}>
              <Trash2 />
            </Button>
          </div>
        ))}
      </Panel>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[26px] tracking-[-1px]">{draft?.existing ? "Edit type" : "New type"}</DialogTitle>
            <DialogDescription>The shape of your content. The API path is the name, for example /content/articles.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="type-name">Name</Label>
                  <Input
                    id="type-name"
                    placeholder="articles"
                    disabled={draft.existing}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type-label">Label</Label>
                  <Input id="type-label" placeholder="Article" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fields</Label>
                {draft.fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label="Field name"
                      className="min-w-0 flex-1 font-mono text-base md:text-[13px]"
                      placeholder="field_name"
                      value={f.name}
                      onChange={(e) => setField(i, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                    />
                    <Select value={f.type} onValueChange={(v) => v && setField(i, { type: v as FieldType })}>
                      <SelectTrigger className="w-[120px]" aria-label="Field type">
                        <SelectValue>{FIELD_TYPES.find((x) => x.value === f.type)?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((x) => (
                          <SelectItem key={x.value} value={x.value}>
                            {x.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Switch checked={!!f.required} onCheckedChange={(c) => setField(i, { required: c })} aria-label="Required" /> Req.
                    </label>
                    <Button size="icon-sm" variant="ghost" aria-label="Remove field" onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, j) => j !== i) })}>
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="bg-secondary" onClick={() => setDraft({ ...draft, fields: [...draft.fields, { name: "", type: "text" }] })}>
                  <Plus /> Add field
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button disabled={busy || !draft?.name || !draft?.label} onClick={save}>
              Save type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
