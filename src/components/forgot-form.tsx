"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, errorMessage } from "@/lib/api"
import { AuthHeading } from "./auth-parts"

export function ForgotForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api("/auth/forgot", { method: "POST", json: { email } })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <AuthHeading title="Check your email" subtitle="If an account exists for that address, a reset link is on its way." />
        <div className="space-y-4 rounded-2xl bg-white p-6 text-center">
          <MailCheck className="mx-auto size-8 text-primary" strokeWidth={1.5} />
          <p className="text-[14px] text-muted-foreground">
            The link works once and expires in 1 hour. Nothing arrived? Check spam, or try again in a few minutes.
          </p>
          <Button variant="outline" className="bg-secondary" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
        <BackToLogin />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <AuthHeading title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link." />
      <div className="space-y-4 rounded-2xl bg-white p-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </div>
      <BackToLogin />
    </form>
  )
}

function BackToLogin() {
  return (
    <p className="text-center text-[14px] text-muted-foreground">
      Remembered it?{" "}
      <Link href="/login" className="text-foreground underline underline-offset-4">
        Back to sign in
      </Link>
    </p>
  )
}
