"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api, errorMessage } from "@/lib/api"
import { AuthHeading, PasswordInput } from "./auth-parts"

export function ResetForm() {
  const [token, setToken] = useState<string | null | undefined>(undefined) // undefined until read
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(new URLSearchParams(window.location.search).get("token"))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) return setError("The two passwords don't match.")
    setBusy(true)
    try {
      await api("/auth/reset", { method: "POST", json: { token, password } })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <AuthHeading title="Password updated" subtitle="You've been signed out everywhere. Sign in with your new password." />
        <div className="rounded-2xl bg-white p-6 text-center">
          <CircleCheck className="mx-auto mb-4 size-8 text-primary" strokeWidth={1.5} />
          <Button size="lg" className="w-full" render={<Link href="/login" />} nativeButton={false}>
            Continue to sign in
          </Button>
        </div>
      </div>
    )
  }

  if (token === null) {
    return (
      <div className="space-y-5">
        <AuthHeading title="Link not valid" subtitle="This reset link is missing its code. Request a new one." />
        <Button size="lg" className="w-full" render={<Link href="/forgot-password" />} nativeButton={false}>
          Request a new link
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <AuthHeading title="Set a new password" subtitle="Choose something at least 8 characters long." />
      <div className="space-y-4 rounded-2xl bg-white p-6">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" required minLength={8} placeholder="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" required minLength={8} placeholder="Repeat the password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}{" "}
            {error.includes("expired") && (
              <Link href="/forgot-password" className="underline underline-offset-4">
                Request a new link
              </Link>
            )}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || token === undefined}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </div>
    </form>
  )
}
