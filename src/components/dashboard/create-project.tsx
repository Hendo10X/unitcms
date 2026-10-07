"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api, errorMessage } from "@/lib/api"
import { useStore, type NewKeys } from "@/lib/store"

export function CreateProject() {
  const { reloadProjects, setNewKeys } = useStore()
  const [name, setName] = useState("")
  const [example, setExample] = useState(true)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const { data } = await api<{ data: NewKeys }>("/projects", { method: "POST", json: { name, example } })
      setNewKeys(data) // shown by <NewKeysDialog /> in the shell, which outlives this form
      await reloadProjects(data.project.id)
      setName("")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" placeholder="Shop App" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <label className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-3 text-[14px]">
        <span>
          Start with example content
          <span className="block text-[12px] text-muted-foreground">Articles, banners, config values and flags.</span>
        </span>
        <Switch checked={example} onCheckedChange={setExample} />
      </label>
      <Button type="submit" disabled={busy || !name.trim()}>
        {busy ? "Creating…" : "Create project"}
      </Button>
    </form>
  )
}

export function NewKeysDialog() {
  const { newKeys, setNewKeys } = useStore()
  return (
    <Dialog open={!!newKeys} onOpenChange={(o) => !o && setNewKeys(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[26px] tracking-[-1px]">{newKeys?.project.name} is ready</DialogTitle>
          <DialogDescription>Delivery keys are shown once. Copy the one you need now. You can create more under API.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {newKeys?.environments.map((e) => (
            <div key={e.name} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] capitalize text-muted-foreground">{e.name}</p>
                <p className="truncate font-mono text-[12.5px]">{e.keys.delivery}</p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Copy ${e.name} key`}
                onClick={() => {
                  navigator.clipboard?.writeText(e.keys.delivery ?? "")
                  toast.success("Key copied")
                }}
              >
                <Copy />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => setNewKeys(null)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
