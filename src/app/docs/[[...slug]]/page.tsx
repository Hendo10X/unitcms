import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { docs } from "@/content/docs"

export function generateStaticParams() {
  return [{ slug: [] }, ...docs.map((d) => ({ slug: [d.slug] }))]
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const doc = docs.find((d) => d.slug === (slug?.[0] ?? "introduction"))
  return { title: doc ? `${doc.title} · UnitCMS Docs` : "Docs · UnitCMS" }
}

type Params = Promise<{ slug?: string[] }>

// The page itself doesn't read the URL. Only DocContent does, inside Suspense,
// so Next.js can show the shell (nav, footer, loading state) instantly.
export default function DocPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DocSkeleton />}>
      <DocContent params={params} />
    </Suspense>
  )
}

function DocSkeleton() {
  return (
    <div className="max-w-[680px] space-y-4" aria-hidden>
      <div className="h-3 w-24 rounded-full bg-secondary" />
      <div className="h-12 w-2/3 rounded-xl bg-secondary" />
      <div className="h-5 w-full rounded-full bg-secondary" />
      <div className="h-5 w-4/5 rounded-full bg-secondary" />
    </div>
  )
}

async function DocContent({ params }: { params: Params }) {
  const { slug } = await params
  if (slug && slug.length > 1) notFound()
  const i = docs.findIndex((d) => d.slug === (slug?.[0] ?? "introduction"))
  if (i < 0) notFound()
  const doc = docs[i]
  const prev = docs[i - 1]
  const next = docs[i + 1]

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[minmax(0,1fr)_170px]">
      <article className="prose-doc min-w-0 max-w-[680px]">
        <p className="eyebrow">{doc.group}</p>
        <h1 className="mt-3 text-[clamp(32px,4vw,48px)]">{doc.title}</h1>
        <p className="mt-4 text-[18px] leading-snug text-muted-foreground">{doc.summary}</p>
        <div className="mt-10">{doc.body}</div>

        <div className="dotted-t mt-16 grid grid-cols-2 gap-4 pt-6">
          {prev ? (
            <Link href={`/docs/${prev.slug}`} className="group">
              <p className="eyebrow flex items-center gap-1"><ArrowLeft className="size-3" /> Previous</p>
              <p className="mt-1 text-[16px] font-medium group-hover:text-primary">{prev.title}</p>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/docs/${next.slug}`} className="group text-right">
              <p className="eyebrow flex items-center justify-end gap-1">Next <ArrowRight className="size-3" /></p>
              <p className="mt-1 text-[16px] font-medium group-hover:text-primary">{next.title}</p>
            </Link>
          )}
        </div>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <p className="eyebrow mb-3">On this page</p>
          <ul className="space-y-2 text-[13px]">
            {doc.headings.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
                  {h.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
