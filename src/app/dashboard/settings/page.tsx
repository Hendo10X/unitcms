"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/dashboard/page-header"
import { CreateProject } from "@/components/dashboard/create-project"
import { useConfirm } from "@/components/dashboard/confirm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, errorMessage } from "@/lib/api"
import { useStore } from "@/lib/store"

export default function SettingsPage() {
  const { project, user, admin, reloadProjects, env, setEnv } = useStore()
  const router = useRouter()
  const confirm = useConfirm()
  const [name, setName] = useState<string | null>(null)
  const value = name ?? project?.name ?? ""

  return (
    <>
      <PageHeader title="Settings" description="Your project, environments and account." />

      <Panel className="max-w-[560px] space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="pname">Project name</Label>
          <Input id="pname" value={value} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Project ID</Label>
          <Input value={project?.id ?? ""} readOnly className="font-mono text-base text-muted-foreground md:text-[13px]" />
        </div>
        <Button
          disabled={!value.trim() || value === project?.name}
          onClick={async () => {
            try {
              await admin("/project", { method: "PATCH", json: { name: value } })
              await reloadProjects(project?.id)
              setName(null)
              toast.success("Project renamed")
            } catch (e) {
              toast.error(errorMessage(e))
            }
          }}
        >
          Save changes
        </Button>
      </Panel>

      <h2 className="mb-4 mt-12 text-[26px] tracking-[-1px]">Environments</h2>
      <Panel className="max-w-[560px] p-2">
        {(["development", "staging", "production"] as const).map((e) => (
          <div key={e} className="flex items-center justify-between rounded-xl px-4 py-3.5">
            <div>
              <p className="text-[14px] font-medium capitalize">{e}</p>
              <p className="text-[12px] text-muted-foreground">Separate keys, content, config and flags</p>
            </div>
            {env === e ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] text-primary">Active</span>
            ) : (
              <Button size="sm" variant="outline" className="bg-secondary" onClick={() => setEnv(e)}>
                Switch
              </Button>
            )}
          </div>
        ))}
      </Panel>

      <h2 className="mb-4 mt-12 text-[26px] tracking-[-1px]">New project</h2>
      <Panel className="max-w-[560px] p-6">
        <CreateProject />
      </Panel>

      <h2 className="mb-4 mt-12 text-[26px] tracking-[-1px]">Account</h2>
      <Panel className="max-w-[560px] p-6">
        <p className="text-[14px]">{user?.name || "Signed in"}</p>
        <p className="text-[13px] text-muted-foreground">{user?.email}</p>
      </Panel>

      <h2 className="mb-4 mt-12 text-[26px] tracking-[-1px] text-destructive">Danger zone</h2>
      <Panel className="flex max-w-[560px] flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[14px] font-medium">Delete this project</p>
          <p className="text-[12.5px] text-muted-foreground">Removes all content, config, flags, media and keys in every environment.</p>
        </div>
        <Button
          variant="destructive"
          onClick={async () => {
            if (!project) return
            const ok = await confirm({
              title: `Delete “${project.name}”?`,
              description: "All content, config, flags, media and keys in every environment are deleted permanently.",
              confirmLabel: "Delete project",
              destructive: true,
            })
            if (!ok) return
            try {
              await api(`/projects/${project.id}`, { method: "DELETE" })
              await reloadProjects()
              router.push("/dashboard")
              toast("Project deleted")
            } catch (e) {
              toast.error(errorMessage(e))
            }
          }}
        >
          Delete project
        </Button>
      </Panel>
    </>
  )
}
