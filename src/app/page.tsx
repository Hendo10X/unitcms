import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Nav, Footer } from "@/components/site/chrome"
import { Reveal } from "@/components/site/reveal"
import { ExplodePhone } from "@/components/site/explode-phone"
import { CoreFeatures, Trio } from "@/components/site/features"
import { SdkDemo } from "@/components/site/sdk-demo"
import { CodeBlock } from "@/components/code-block"

function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
}: {
  id?: string
  eyebrow?: string
  title: React.ReactNode
  sub?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="dotted-t">
      <div className="dotted-x mx-auto max-w-[1080px] px-6 py-24 text-center">
        <Reveal>
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 className="mx-auto max-w-[760px] text-[clamp(30px,4vw,48px)]">{title}</h2>
          {sub && <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-snug text-muted-foreground">{sub}</p>}
        </Reveal>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  )
}

const steps = [
  ["Create a project", "Name it, pick an environment, get a project ID."],
  ["Define a content type", "Fields for text, images, references and more."],
  ["Add content", "Write it, save drafts, publish when ready."],
  ["Install the SDK", "npm install @unitcms/react-native"],
  ["Add your delivery key", "A read-only key that only sees published content."],
  ["Fetch", "One line. Cached, typed and offline-safe."],
  ["Ship", "Change content later without shipping the app."],
]

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section>
          <div className="dotted-x mx-auto max-w-[1080px] px-6 pb-16 pt-20 text-center">
            <Reveal>
              {/* Two lines from tablet up; wraps naturally on phones so the text stays a readable size. */}
              <h1 className="text-[clamp(38px,7vw,70px)]">
                <span className="block sm:whitespace-nowrap">Ship app content</span>
                <span className="block sm:whitespace-nowrap">without shipping an update.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[560px] text-[18px] leading-snug text-muted-foreground">
                Content, remote config, feature flags and offline caching in one mobile-first system. Built for
                React Native and Expo.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" render={<Link href="/signup" />} nativeButton={false}>
                  Start building <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/docs/quickstart" />} nativeButton={false}>
                  Read the quickstart
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="mt-16">
              <ExplodePhone />
            </Reveal>
          </div>
        </section>

        <Section
          id="features"
          title="Built for the complexity of mobile apps."
          sub="Websites refetch on every visit. Apps need to feel instant, survive bad networks and change behaviour remotely."
        >
          <CoreFeatures />
        </Section>

        <Section
          title="Content, config and flags. Nothing to assemble."
          sub="Stop stitching a CMS, an API client, a cache and a flag service together."
        >
          <Trio />
        </Section>

        <Section
          id="sdk"
          title="Zero to remote content in five minutes."
          sub="Every response is cached on device and labelled with where it came from."
        >
          <SdkDemo />
          {/* Each stat stays on one line, even on a phone. */}
          <div className="mx-auto mt-14 flex max-w-[680px] justify-between gap-3">
            {[
              ["< 5 min", "to first request"],
              ["0 lines", "of cache code"],
              ["3 sources", "network, cache, offline"],
            ].map(([a, b]) => (
              <div key={a} className="whitespace-nowrap">
                <p className="text-[19px] font-medium tracking-[-0.04em] sm:text-[28px]">{a}</p>
                <p className="mt-1 text-[10.5px] text-muted-foreground sm:text-[13px]">{b}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Create. Define. Install. Fetch. Done.">
          <div className="mx-auto max-w-[620px] text-left">
            {steps.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.03}>
                <div className="dotted-t flex items-baseline gap-6 py-5">
                  <span className="eyebrow w-6">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[19px] font-medium tracking-[-0.5px]">{t}</p>
                    <p className="mt-1 text-[15px] text-muted-foreground">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="dotted-t" />
          </div>
        </Section>

        <Section title="Predictable, versioned, boring in the best way.">
          <div className="mx-auto max-w-[680px]">
            <CodeBlock
              title="GET /v1/projects/proj_123/content/articles"
              code={`{
  "data": [
    {
      "id": "article_123",
      "type": "articles",
      "attributes": {
        "title": "Welcome to UnitCMS",
        "slug": "welcome-to-unitcms"
      }
    }
  ],
  "meta": { "count": 1 }
}`}
            />
            <div className="mt-8">
              <Button variant="outline" render={<Link href="/docs/rest-api" />} nativeButton={false}>
                Explore the API <ArrowRight />
              </Button>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  )
}
