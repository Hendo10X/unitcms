"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, errorMessage } from "@/lib/api"
import { AuthHeading, PasswordInput } from "./auth-parts"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signup = mode === "signup"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api(signup ? "/auth/signup" : "/auth/login", { method: "POST", json: { email, password, ...(signup ? { name } : {}) } })
      // Only allow redirects back into the dashboard.
      const next = new URLSearchParams(window.location.search).get("next")
      router.push(next && next.startsWith("/dashboard") ? next : "/dashboard")
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <AuthHeading
        title={signup ? "Create your account" : "Welcome back"}
        subtitle={signup ? "Start managing app content in minutes." : "Sign in to your dashboard."}
      />

      <div className="space-y-4 rounded-2xl bg-white p-6">
        {signup && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!signup && (
              <Link href="/forgot-password" className="text-[12.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <PasswordInput
            id="password"
            required
            minLength={signup ? 8 : undefined}
            placeholder={signup ? "Create a password" : "Your password"}
            autoComplete={signup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {signup && <p className="text-[12px] text-muted-foreground">At least 8 characters.</p>}
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
        </Button>
      </div>

      <p className="text-center text-[14px] text-muted-foreground">
        {signup ? "Already have an account? " : "New to UnitCMS? "}
        <Link href={signup ? "/login" : "/signup"} className="text-foreground underline underline-offset-4">
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  )
}
