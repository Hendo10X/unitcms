"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthState } from "./use-auth"

/** Desktop buttons on the right of the nav. Signed-in visitors get a way back into the dashboard. */
export function NavActions() {
  const auth = useAuthState()
  return (
    <div className={`hidden items-center gap-2 md:flex ${auth === "unknown" ? "invisible" : ""}`}>
      {auth === "in" ? (
        <Button size="sm" render={<Link href="/dashboard" />} nativeButton={false}>
          Open dashboard
        </Button>
      ) : (
        <>
          <Button size="sm" variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/signup" />} nativeButton={false}>
            Get started
          </Button>
        </>
      )}
    </div>
  )
}
