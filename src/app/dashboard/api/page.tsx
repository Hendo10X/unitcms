"use client"

import { useState } from "react"
import { Copy, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CodeBlock } from "@/components/code-block"
import { Ago } from "@/components/dashboard/ago"
import { useConfirm } from "@/components/dashboard/confirm"
import { errorMessage } from "@/lib/api"
import { useResource, useStore } from "@/lib/store"
import type { ApiKey } from "@/lib/types"

export default function ApiPage() {
  const { project, env, admin } = useStore()
  const confirm = useConfirm()
  const { data, loading, error, reload } = useResource<{ data: ApiKey[] }>("/keys")
  const [kind, setKind] = useState<"delivery" | "admin">("delivery")
  const [label, setLabel] = useState("")
  const [fresh, setFresh] = useState<{ key: string; kind: string } | null>(null)
  const keys = (data?.data ?? []).filter((k) => !k.revokedAt)
  const origin = typeof window === "undefined" ? "" : window.location.origin

  async function create() {
    try {
      const res = await admin<{ data: { key: string; kind: string } }>("/keys", { method: "POST", json: { kind, label } })
      setFresh(res.data)
      setLabel("")
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="API"
        description={`Keys for the ${env} environment. Delivery keys are safe in your app and only see published content. Admin keys must stay on your server.`}
      />
      {error && <p className="mb-3 text-[14px] text-destructive">{error}</p>}
      <Panel className="p-2">
        {keys.map((k) => (
          <div key={k.id} className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-background">
            <div className="w-[200px]">
              <p className="text-[14px] font-medium">{k.label || "Untitled key"}</p>
              <p className={`text-[12px] ${k.kind === "admin" ? "text-destructive" : "text-muted-foreground"}`}>
                {k.kind === "admin" ? "Admin (server only)" : "Delivery (read-only)"}
              </p>
            </div>
            <p className="min-w-0 flex-1 truncate font-mono text-[13px]">{k.prefix}…</p>
            <span className="text-[12px] text-muted-foreground"><Ago iso={k.createdAt} /></span>
            <Button
              size="sm"
              variant="outline"
              className="bg-secondary"
              onClick={async () => {
                const ok = await confirm({
                  title: `Revoke ${k.label || "this key"}?`,
                  description: "Apps using it will stop working straight away. This can't be undone.",
                  confirmLabel: "Revoke key",
                  destructive: true,
                })
                if (!ok) return
                try { await admin(`/keys/${k.id}`, { method: "DELETE" }); reload() } catch (e) { toast.error(errorMessage(e)) }
              }}
            >
              Revoke
            </Button>
          </div>
        ))}
        {!loading && keys.length === 0 && <p className="p-10 text-center text-[14px] text-muted-foreground">No active keys. Create one below.</p>}
      </Panel>

      <Panel className="mt-3 flex flex-wrap items-center gap-3 p-4">
        <Input placeholder="Label, e.g. iOS app" value={label} onChange={(e) => setLabel(e.target.value)} className="min-w-[180px] flex-1" />
        <Select value={kind} onValueChange={(v) => v && setKind(v as "delivery" | "admin")}>
          <SelectTrigger className="w-[150px]"><SelectValue>{kind === "delivery" ? "Delivery" : "Admin"}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={create}><Plus /> Create key</Button>
      </Panel>

      <h2 className="mb-4 mt-12 text-[26px] tracking-[-1px]">Try it</h2>
      <CodeBlock
        title="Fetch published content"
        code={`curl ${origin}/v1/projects/${project?.id ?? "proj_..."}/content/articles \\
  -H "Authorization: Bearer <delivery key>"`}
      />

      <Dialog open={!!fresh} onOpenChange={(o) => !o && setFresh(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[26px] tracking-[-1px]">Copy your key now</DialogTitle>
            <DialogDescription>This is the only time it is shown. We store a hash, so we can&apos;t show it again.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <p className="min-w-0 flex-1 break-all font-mono text-[12.5px]">{fresh?.key}</p>
            <Button size="icon-sm" variant="ghost" aria-label="Copy key" onClick={() => { navigator.clipboard?.writeText(fresh?.key ?? ""); toast.success("Key copied") }}>
              <Copy />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setFresh(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
