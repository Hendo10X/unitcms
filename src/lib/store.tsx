"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { api, ApiRequestError, errorMessage, type RequestOptions } from "./api"
import type { Env, Project, User } from "./types"

type Status = "loading" | "ready"

type Ctx = {
  status: Status
  user: User | null
  projects: Project[]
  project: Project | null
  env: Env
  setEnv: (e: Env) => void
  selectProject: (id: string) => void
  reloadProjects: (selectId?: string) => Promise<void>
  /** Call the management API of the current project and environment. */
  admin: <T = unknown>(path: string, opts?: RequestOptions) => Promise<T>
  signOut: () => Promise<void>
  /** Keys from a just-created project, shown once. */
  newKeys: NewKeys | null
  setNewKeys: (k: NewKeys | null) => void
}

export type NewKeys = { project: { id: string; name: string }; environments: { name: string; keys: { delivery?: string } }[] }

const StoreCtx = createContext<Ctx | null>(null)
const PROJECT_KEY = "unitcms.project"
const ENV_KEY = "unitcms.env"

const read = (k: string) => {
  try { return localStorage.getItem(k) } catch { return null }
}
const write = (k: string, v: string) => {
  try { localStorage.setItem(k, v) } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<Status>("loading")
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [env, setEnvState] = useState<Env>("production")
  const [newKeys, setNewKeys] = useState<NewKeys | null>(null)

  const loadProjects = useCallback(async (selectId?: string) => {
    const { data } = await api<{ data: Project[] }>("/projects")
    setProjects(data)
    setProjectId((cur) => {
      const want = selectId ?? cur ?? read(PROJECT_KEY)
      const id = data.find((p) => p.id === want)?.id ?? data[0]?.id ?? null
      if (id) write(PROJECT_KEY, id)
      return id
    })
  }, [])

  useEffect(() => {
    const saved = read(ENV_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "development" || saved === "staging" || saved === "production") setEnvState(saved)

    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api<{ data: User }>("/auth/me")
        if (cancelled) return
        setUser(data)
        await loadProjects()
        if (!cancelled) setStatus("ready")
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        } else if (!cancelled) {
          setStatus("ready")
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // Runs once; later navigation inside the dashboard doesn't need to re-check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      status,
      user,
      projects,
      project: projects.find((p) => p.id === projectId) ?? null,
      env,
      setEnv: (e) => {
        write(ENV_KEY, e)
        setEnvState(e)
      },
      selectProject: (id) => {
        write(PROJECT_KEY, id)
        setProjectId(id)
      },
      reloadProjects: loadProjects,
      admin: (path, opts) => {
        if (!projectId) return Promise.reject(new Error("No project selected."))
        return api(`/projects/${projectId}/admin${path}`, { ...opts, env })
      },
      signOut: async () => {
        await api("/auth/logout", { method: "POST" }).catch(() => {})
        router.push("/login")
      },
      newKeys,
      setNewKeys,
    }),
    [status, user, projects, projectId, env, loadProjects, router, newKeys],
  )

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error("useStore must be used inside StoreProvider")
  return c
}

/**
 * Loads a management API path for the current project and environment.
 * `reload()` fetches again (call it after a change).
 */
export function useResource<T>(path: string | null) {
  const { admin, project, env, status } = useStore()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!path || !project || status !== "ready") return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    admin<T>(path)
      .then((r) => {
        if (cancelled) return
        setData(r)
        setError(null)
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // `admin` reads project/env from refs, so depend on those values directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, project?.id, env, status, tick])

  return { data, error, loading, reload: useCallback(() => setTick((t) => t + 1), []) }
}
