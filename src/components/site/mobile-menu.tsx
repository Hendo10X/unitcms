"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthState } from "./use-auth"

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#sdk", label: "SDK" },
  { href: "/docs", label: "Docs" },
  { href: "/docs/rest-api", label: "API" },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const auth = useAuthState()
  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center rounded-full bg-white"
      >
        {open ? <X className="size-5" strokeWidth={1.6} /> : <Menu className="size-5" strokeWidth={1.6} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 bg-background px-6 pb-8 pt-2">
          <ul>
            {links.map((l) => (
              <li key={l.href} className="dotted-t">
                <Link href={l.href} onClick={close} className="block py-4 text-[26px] tracking-[-1px]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="dotted-t flex flex-col gap-2 pt-6">
            {auth === "in" ? (
              <Button size="lg" render={<Link href="/dashboard" onClick={close} />} nativeButton={false}>
                Open dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" render={<Link href="/signup" onClick={close} />} nativeButton={false}>
                  Get started
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/login" onClick={close} />} nativeButton={false}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
