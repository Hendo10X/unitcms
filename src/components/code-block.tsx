"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

const KEYWORDS =
  /\b(import|from|const|let|await|async|return|export|default|function|new|type|if|else|true|false|null|npm|npx|install|curl|GET|POST|PUT|DELETE)\b/g

/** Tiny dependency-free highlighter: comments, strings, keywords, numbers. */
function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  const plain = (s: string) => {
    const parts = s.split(KEYWORDS)
    parts.forEach((p, i) => {
      if (i % 2 === 1) out.push(<span key={k++} className="text-primary">{p}</span>)
      else
        p.split(/(\b\d+(?:\.\d+)?\b)/).forEach((q, j) =>
          j % 2 === 1
            ? out.push(<span key={k++} className="text-[#d97706]">{q}</span>)
            : out.push(q),
        )
    })
  }
  while ((m = re.exec(code))) {
    plain(code.slice(last, m.index))
    out.push(
      <span key={k++} className={m[1] ? "text-[#a3a39d]" : "text-[#0f9d6b]"}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  plain(code.slice(last))
  return out
}

export function CodeBlock({
  code,
  title,
  className,
}: {
  code: string
  title?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-white text-left", className)}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 font-mono text-[11px] text-muted-foreground">
          {title}
        </div>
      )}
      <button
        type="button"
        aria-label="Copy code"
        onClick={() => {
          navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75] tracking-normal text-[#2b2b28]">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
