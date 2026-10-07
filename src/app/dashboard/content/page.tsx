"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Ago } from "@/components/dashboard/ago"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/api"
import { useResource, useStore } from "@/lib/store"
import { titleOf, type ContentType, type Entry, type MediaItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EntryEditor } from "./entry-editor"
import { TypesPanel } from "./types-panel"

export default function ContentPage() {
  const { admin } = useStore()
  const types = useResource<{ data: ContentType[] }>("/types")
  const entries = useResource<{ data: Entry[] }>("/entries?limit=100")
  const media = useResource<{ data: MediaItem[] }>("/media")

  const [tab, setTab] = useState<"entries" | "types">("entries")
  const [q, setQ] = useState("")
  const [type, setType] = useState("all")
  const [sort, setSort] = useState<"updated" | "title">("updated")
  const [editing, setEditing] = useState<{ entry: Entry | null } | null>(null)

  const typeList = types.data?.data ?? []
  const all = entries.data?.data ?? []

  const list = useMemo(() => {
    const needle = q.toLowerCase()
    const f = all.filter((e) => (type === "all" || e.type === type) && (!needle || JSON.stringify(e.attributes).toLowerCase().includes(needle)))
    return [...f].sort((a, b) => (sort === "title" ? titleOf(a).localeCompare(titleOf(b)) : +new Date(b.meta.updatedAt) - +new Date(a.meta.updatedAt)))
  }, [all, q, type, sort])

  async function act(label: string, fn: () => Promise<unknown>) {
    try {
      await fn()
      toast(label)
      entries.reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="Content"
        description="Create, draft and publish. The mobile API only returns published entries."
        action={
          tab === "entries" && (
            <Button onClick={() => (typeList.length ? setEditing({ entry: null }) : setTab("types"))}>
              <Plus /> New entry
            </Button>
          )
        }
      />

      <div className="mb-5 inline-flex rounded-full bg-white p-1">
        {(["entries", "types"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-full px-4 py-1.5 text-[13px] capitalize transition-colors", tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "types" ? (
        <TypesPanel types={typeList} onChanged={() => { types.reload(); entries.reload() }} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content" className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-1 rounded-full bg-white p-1">
              {["all", ...typeList.map((t) => t.name)].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn("rounded-full px-3.5 py-1.5 text-[13px] capitalize transition-colors", type === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => setSort((s) => (s === "updated" ? "title" : "updated"))} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              Sort: {sort === "updated" ? "Recently updated" : "Title"}
            </button>
          </div>

          {(entries.error || types.error) && <p className="mb-3 text-[14px] text-destructive">{entries.error ?? types.error}</p>}

          <Panel className="p-2">
            {!entries.loading && list.length === 0 && (
              <p className="p-10 text-center text-[14px] text-muted-foreground">
                {typeList.length === 0 ? "Create a content type first, under Types." : all.length === 0 ? "No entries yet. Create your first one." : "Nothing matches."}
              </p>
            )}
            {list.map((e) => (
              <div key={e.id} className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-background">
                <button onClick={() => setEditing({ entry: e })} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[15px] font-medium tracking-[-0.3px]">{titleOf(e)}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                    {e.type} · {e.id} · <Ago iso={e.meta.updatedAt} />
                  </p>
                </button>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px]", e.meta.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                  {e.meta.status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-secondary"
                  onClick={() =>
                    act(e.meta.status === "published" ? "Unpublished" : "Published", () =>
                      admin(`/entries/${e.id}/${e.meta.status === "published" ? "unpublish" : "publish"}`, { method: "POST" }),
                    )
                  }
                >
                  {e.meta.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => window.confirm(`Delete "${titleOf(e)}"?`) && act("Entry deleted", () => admin(`/entries/${e.id}`, { method: "DELETE" }))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </Panel>
        </>
      )}

      <EntryEditor
        open={!!editing}
        entry={editing?.entry ?? null}
        types={typeList}
        media={media.data?.data ?? []}
        defaultType={type !== "all" ? type : undefined}
        onClose={() => setEditing(null)}
        onSaved={entries.reload}
      />
    </>
  )
}
