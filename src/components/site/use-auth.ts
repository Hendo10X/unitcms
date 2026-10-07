"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

/** "unknown" until we've asked the server whether a session cookie is valid. */
export function useAuthState() {
  const [state, setState] = useState<"unknown" | "in" | "out">("unknown")
  useEffect(() => {
    let live = true
    api("/auth/me")
      .then(() => live && setState("in"))
      .catch(() => live && setState("out"))
    return () => {
      live = false
    }
  }, [])
  return state
}
