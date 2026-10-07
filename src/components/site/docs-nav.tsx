"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { docs, groups } from "@/content/docs"
import { cn } from "@/lib/utils"

export function DocsNav() {
  const path = usePathname()
  const current = path === "/docs" ? "introduction" : path.replace("/docs/", "")
  return (
    <>
      <nav className="hidden space-y-7 lg:block">
        {groups.map((g) => (
          <div key={g}>
            <p className="eyebrow mb-2 px-3">{g}</p>
            <ul>
              {docs
                .filter((d) => d.group === g)
                .map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/docs/${d.slug}`}
                      className={cn(
                        "block rounded-full px-3 py-1.5 text-[14px] transition-colors",
                        current === d.slug ? "bg-white font-medium" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {d.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>
      <nav className="-mx-6 flex gap-1 overflow-x-auto px-6 pb-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {docs.map((d) => (
          <Link
            key={d.slug}
            href={`/docs/${d.slug}`}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px]",
              current === d.slug ? "bg-primary text-white" : "bg-white text-muted-foreground",
            )}
          >
            {d.title}
          </Link>
        ))}
      </nav>
    </>
  )
}
