import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Nav } from "@/components/site/chrome"

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-[clamp(32px,6vw,56px)]">Page not found</h1>
        <p className="mt-4 text-[16px] text-muted-foreground">That page doesn&apos;t exist, or it moved.</p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" render={<Link href="/" />} nativeButton={false}>
            Go home
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/docs" />} nativeButton={false}>
            Read the docs
          </Button>
        </div>
      </main>
    </>
  )
}
