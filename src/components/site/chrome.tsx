import Link from "next/link"
import { Logo } from "./logo"
import { NavActions } from "./nav-actions"
import { MobileMenu } from "./mobile-menu"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-[14px] text-muted-foreground md:flex">
          <Link href="/#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/#sdk" className="transition-colors hover:text-foreground">SDK</Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link>
          <Link href="/docs/rest-api" className="transition-colors hover:text-foreground">API</Link>
        </nav>
        <NavActions />
        <MobileMenu />
      </div>
    </header>
  )
}

const rows: { label: string; links: { t: string; href: string }[] }[] = [
  {
    label: "Help",
    links: [
      { t: "Quickstart", href: "/docs/quickstart" },
      { t: "Docs", href: "/docs" },
      { t: "REST API", href: "/docs/rest-api" },
    ],
  },
  { label: "Contact", links: [{ t: "hello@unitcms.dev", href: "mailto:hello@unitcms.dev" }] },
  {
    label: "Social",
    links: [
      { t: "X", href: "https://x.com" },
      { t: "GitHub", href: "https://github.com" },
      { t: "Linkedin", href: "https://linkedin.com" },
    ],
  },
  {
    label: "Legal",
    links: [
      { t: "Terms", href: "#" },
      { t: "Privacy", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="dotted-t">
      <div className="dotted-x mx-auto max-w-[1080px] px-6 pb-16 pt-24">
        <div className="mx-auto max-w-[820px]">
          <h2 className="text-[clamp(30px,4.4vw,52px)]">Start shipping today with UnitCMS</h2>
          <div className="mt-10 flex flex-wrap gap-x-14 gap-y-6">
            <div>
              <p className="text-[15px] text-muted-foreground">Get started</p>
              <div className="mt-2 flex gap-5">
                <FooterBig href="/signup">Create account</FooterBig>
                <FooterBig href="/login">Sign in</FooterBig>
              </div>
            </div>
            <div>
              <p className="text-[15px] text-muted-foreground">Build</p>
              <div className="mt-2 flex gap-6">
                <FooterBig href="/docs/quickstart">Quickstart</FooterBig>
                <FooterBig href="/docs/sdk-react-native">React Native SDK</FooterBig>
              </div>
            </div>
          </div>

          <div className="mt-16">
            {rows.map((r) => (
              <div key={r.label} className="dotted-t flex items-center justify-between py-4 text-[14px]">
                <span className="text-[#a3a39d]">{r.label}</span>
                <div className="flex gap-8">
                  {r.links.map((l) => (
                    <Link key={l.t} href={l.href} className="transition-opacity hover:opacity-60">
                      {l.t}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="dotted-t" />
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground">© 2026 UnitCMS. Built for apps, not websites.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterBig({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border-b border-foreground text-[20px] font-medium tracking-[-0.6px] transition-opacity hover:opacity-60"
    >
      {children}
    </Link>
  )
}
