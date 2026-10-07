"use client"

import { useRef, useState } from "react"
import { Copy, FileText, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/page-header"
import { useConfirm } from "@/components/dashboard/confirm"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/lib/api"
import { useResource, useStore } from "@/lib/store"
import { formatBytes, type MediaItem } from "@/lib/types"

const imageSize = (file: File) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })

export default function MediaPage() {
  const { admin } = useStore()
  const confirm = useConfirm()
  const { data, loading, error, reload } = useResource<{ data: MediaItem[] }>("/media")
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const items = data?.data ?? []

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    for (const file of Array.from(files)) {
      try {
        const form = new FormData()
        form.set("file", file)
        const size = await imageSize(file)
        if (size) {
          form.set("width", String(size.width))
          form.set("height", String(size.height))
        }
        await admin("/media/upload", { method: "POST", form })
        toast.success(`Uploaded ${file.name}`)
      } catch (e) {
        toast.error(`${file.name}: ${errorMessage(e)}`)
      }
    }
    setBusy(false)
    reload()
  }

  return (
    <>
      <PageHeader
        title="Media"
        description="Images and files with the metadata your app needs: size, dimensions and a stable URL. Up to 4 MB each."
        action={
          <>
            <input ref={input} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = "" }} />
            <Button disabled={busy} onClick={() => input.current?.click()}>
              <Upload /> {busy ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      />
      {error && <p className="mb-3 text-[14px] text-destructive">{error}</p>}
      {!loading && items.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-[14px] text-muted-foreground">No files yet.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="group rounded-2xl bg-white p-2">
            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-secondary">
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.filename} className="size-full object-cover" loading="lazy" />
              ) : (
                <FileText className="size-7 text-muted-foreground" strokeWidth={1.4} />
              )}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  aria-label="Copy URL"
                  onClick={() => { navigator.clipboard?.writeText(m.url); toast.success("URL copied") }}
                  className="grid size-7 place-items-center rounded-full bg-white/90"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  aria-label="Delete"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete ${m.filename}?`,
                      description: "Entries that point to this file will lose it. This can't be undone.",
                      confirmLabel: "Delete",
                      destructive: true,
                    })
                    if (!ok) return
                    try { await admin(`/media/${m.id}`, { method: "DELETE" }); reload() } catch (e) { toast.error(errorMessage(e)) }
                  }}
                  className="grid size-7 place-items-center rounded-full bg-white/90"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="px-2 pb-1.5 pt-3">
              <p className="truncate text-[13.5px] font-medium">{m.filename}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {formatBytes(m.size)}
                {m.width ? ` · ${m.width}×${m.height}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
