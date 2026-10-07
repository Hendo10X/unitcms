"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, FileText, Image as ImageIcon, SlidersHorizontal, Flag, KeyRound, Settings, LogOut, Menu } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/site/logo"
import { CreateProject, NewKeysDialog } from "./create-project"
import { useStore } from "@/lib/store"
import type { Env } from "@/lib/types"

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/media", label: "Media", icon: ImageIcon },
  { href: "/dashboard/config", label: "Config", icon: SlidersHorizontal },
  { href: "/dashboard/flags", label: "Feature flags", icon: Flag },
  { href: "/dashboard/api", label: "API", icon: KeyRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const envs: Env[] = ["development", "staging", "production"]

const initials = (s: string) => {
  const parts = s.split(/[\s@._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U"
}

/** Phone-only top bar with a comfortably sized menu button. */
function MobileBar() {
  const { toggleSidebar } = useSidebar()
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background px-6 md:hidden">
      <Logo href="/dashboard" />
      <button
        type="button"
        aria-label="Open navigation"
        onClick={toggleSidebar}
        className="grid size-11 place-items-center rounded-full bg-white"
      >
        <Menu className="size-5" strokeWidth={1.6} />
      </button>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { status, user, projects, project, selectProject, env, setEnv, signOut } = useStore()
  const needsProject = status === "ready" && !project

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-5 p-4">
          <Logo href="/dashboard" />
          <div className="space-y-2">
            {projects.length > 1 ? (
              <Select value={project?.id ?? ""} onValueChange={(v) => v && selectProject(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{project?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="eyebrow px-1">{project?.name ?? " "}</p>
            )}
            <Select value={env} onValueChange={(v) => v && setEnv(v as Env)}>
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {envs.map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {nav.map((n) => {
                  const active = n.href === "/dashboard" ? path === n.href : path.startsWith(n.href)
                  return (
                    <SidebarMenuItem key={n.href}>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={n.href} />}
                        className="h-10 rounded-full px-4 text-[14px] data-active:bg-white data-active:font-medium"
                      >
                        <n.icon strokeWidth={1.7} />
                        {n.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-3 p-4">
          <div className="space-y-3 rounded-2xl bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-medium text-white" aria-hidden>
                {initials(user?.name || user?.email || "")}
              </span>
              <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{user?.name || "Your account"}</p>
            </div>
            <Button variant="outline" className="w-full bg-secondary" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <MobileBar />
        <div className="mx-auto w-full max-w-[1000px] px-6 pb-24 pt-10 md:px-10 md:pt-14">
          {needsProject ? (
            <div className="mx-auto max-w-[460px] pt-10">
              <h1 className="text-[40px] tracking-[-1.8px]">Create your first project</h1>
              <p className="mb-8 mt-2 text-[15px] text-muted-foreground">A project holds the content, config and flags for one app.</p>
              <div className="rounded-2xl bg-white p-6">
                <CreateProject />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
      <NewKeysDialog />
    </SidebarProvider>
  )
}
