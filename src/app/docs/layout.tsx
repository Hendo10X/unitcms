import { Nav, Footer } from "@/components/site/chrome"
import { DocsNav } from "@/components/site/docs-nav"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="dotted-t">
        <div className="dotted-x mx-auto grid max-w-[1080px] grid-cols-[minmax(0,1fr)] gap-10 px-6 py-12 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DocsNav />
          </aside>
          {children}
        </div>
      </div>
      <Footer />
    </>
  )
}
