"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Something broke</p>
      <h1 className="mt-3 text-[clamp(32px,6vw,56px)]">That didn&apos;t work</h1>
      <p className="mt-4 text-[16px] text-muted-foreground">An unexpected error happened on our side. Try again, and if it keeps happening let us know.</p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/" />} nativeButton={false}>
          Go home
        </Button>
      </div>
    </main>
  )
}
