import type { ReactNode } from "react"
import Link from "next/link"
import { CodeBlock } from "@/components/code-block"

/* Small authoring helpers ------------------------------------------- */
const H2 = ({ children, id }: { children: ReactNode; id: string }) => <h2 id={id}>{children}</h2>
const H3 = ({ children }: { children: ReactNode }) => <h3>{children}</h3>
const P = ({ children }: { children: ReactNode }) => <p>{children}</p>
const C = ({ children }: { children: ReactNode }) => <code className="inline">{children}</code>
const UL = ({ children }: { children: ReactNode }) => <ul>{children}</ul>
const Note = ({ children, title = "Note" }: { children: ReactNode; title?: string }) => (
  <div className="my-6 rounded-2xl bg-white p-5 text-[14.5px] leading-relaxed text-[#3d3d3a]">
    <p className="eyebrow mb-1.5 text-primary">{title}</p>
    {children}
  </div>
)
const Code = ({ children, title }: { children: string; title?: string }) => (
  <CodeBlock className="my-5" title={title} code={children.trim()} />
)
const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="my-6 overflow-x-auto rounded-2xl bg-white p-2">
    <table className="w-full text-left text-[13.5px]">
      <thead>
        <tr className="text-muted-foreground">
          {head.map((h) => (
            <th key={h} className="px-4 py-2.5 font-normal">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="dotted-t">
            {r.map((c, j) => (
              <td key={j} className="px-4 py-3 align-top">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export type Heading = { id: string; label: string }
export type Doc = {
  slug: string
  title: string
  group: string
  summary: string
  headings: Heading[]
  body: ReactNode
}

export const docs: Doc[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "introduction",
    title: "Introduction",
    group: "Getting started",
    summary: "What UnitCMS is, who it is for, and how the pieces fit together.",
    headings: [
      { id: "what", label: "What is UnitCMS" },
      { id: "why", label: "Why mobile-first" },
      { id: "pieces", label: "The four pieces" },
    ],
    body: (
      <>
        <H2 id="what">What is UnitCMS</H2>
        <P>
          UnitCMS is a headless CMS built specifically for mobile apps. It gives you content management, remote
          config, feature flags and media in one place, plus a React Native and Expo SDK that handles fetching,
          caching and offline behaviour for you.
        </P>
        <P>
          The goal is simple: change what your app shows, or how it behaves, without shipping a new version to the
          app stores.
        </P>

        <H2 id="why">Why mobile-first</H2>
        <P>
          General-purpose CMSs are built to serve websites first. A website can refetch on every visit and show a
          loading page. A mobile app cannot. It has to render instantly, survive bad connections, and stay useful
          offline. Most CMSs leave all of that to you.
        </P>
        <UL>
          <li>Fetching, retries and loading states</li>
          <li>Persistent caching and background refresh</li>
          <li>Remote configuration and feature flags</li>
          <li>Offline behaviour</li>
        </UL>
        <P>UnitCMS ships those as part of the product instead of as a weekend of glue code.</P>

        <H2 id="pieces">The four pieces</H2>
        <Table
          head={["Piece", "What it does"]}
          rows={[
            [<C key="a">Content</C>, "Schemas, entries, drafts and publishing. Only published content is delivered to apps."],
            [<C key="b">Config</C>, "Typed key-value settings you can change remotely: strings, numbers, booleans and JSON."],
            [<C key="c">Flags</C>, "Boolean switches that turn features on or off per environment."],
            [<C key="d">SDK</C>, "A tiny client that fetches, caches and reports where each response came from."],
          ]}
        />
        <Note>
          UnitCMS is intentionally small. There is no page builder, no localization platform and no complex role
          system in the MVP. That is a feature.
        </Note>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "quickstart",
    title: "Quickstart",
    group: "Getting started",
    summary: "From an empty project to remote content in your app in under five minutes.",
    headings: [
      { id: "project", label: "1. Create a project" },
      { id: "type", label: "2. Define a content type" },
      { id: "content", label: "3. Add content" },
      { id: "install", label: "4. Install the SDK" },
      { id: "fetch", label: "5. Fetch" },
      { id: "change", label: "6. Change it remotely" },
    ],
    body: (
      <>
        <P>
          This guide takes you from nothing to an Expo app that renders content managed in UnitCMS. It should take
          less than five minutes.
        </P>
        <H2 id="project">1. Create a project</H2>
        <P>
          Open the dashboard and create a project. You get a project ID like <C>proj_123</C> and three environments:
          development, staging and production. Each has its own content, config, flags and keys.
        </P>
        <H2 id="type">2. Define a content type</H2>
        <P>
          Content types describe the shape of your content. For this guide, create an <C>articles</C> type with a
          few fields.
        </P>
        <Table
          head={["Field", "Type"]}
          rows={[
            [<C key="1">title</C>, "Text"],
            [<C key="2">slug</C>, "Text"],
            [<C key="3">body</C>, "Rich Text"],
            [<C key="4">coverImage</C>, "Image"],
          ]}
        />
        <H2 id="content">3. Add content</H2>
        <P>
          Go to <strong>Content</strong>, create an entry and press <strong>Publish</strong>. Drafts are never
          returned by the delivery API, so publishing is what makes it visible to your app.
        </P>
        <H2 id="install">4. Install the SDK</H2>
        <Code title="terminal">{`npx expo install @unitcms/react-native @react-native-async-storage/async-storage`}</Code>
        <P>
          Copy a <strong>delivery key</strong> from <strong>API</strong>. Delivery keys are read-only and safe to
          include in your app.
        </P>
        <Code title="lib/unit.ts">{`
import { Unit } from "@unitcms/react-native"

export const unit = Unit({
  project: "proj_123",
  token: "unit_prod_pub_..."
})
`}</Code>
        <H2 id="fetch">5. Fetch</H2>
        <Code title="app/index.tsx">{`
import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { unit } from "../lib/unit"

export default function Home() {
  const [titles, setTitles] = useState<string[]>([])

  useEffect(() => {
    unit.content("articles").list({ limit: 10 }).then((res) => {
      setTitles(res.data.map((a) => a.attributes.title))
    })
  }, [])

  return (
    <View>
      {titles.map((t) => <Text key={t}>{t}</Text>)}
    </View>
  )
}
`}</Code>
        <H2 id="change">6. Change it remotely</H2>
        <P>
          Edit the entry in the dashboard and publish again. The next time your app refreshes, the new content
          appears. No build, no review, no release.
        </P>
        <Note title="Tip">
          Run the app, switch on airplane mode and reload. You will still see your content, served from the local
          cache with <C>meta.source</C> set to <C>&quot;offline&quot;</C>.
        </Note>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "projects-and-environments",
    title: "Projects & environments",
    group: "Concepts",
    summary: "How projects, environments and keys isolate your data.",
    headings: [
      { id: "projects", label: "Projects" },
      { id: "environments", label: "Environments" },
      { id: "keys", label: "Keys" },
    ],
    body: (
      <>
        <H2 id="projects">Projects</H2>
        <P>
          A project represents one app. It owns its schemas, content, media, config, flags and API keys. Nothing is
          shared between projects.
        </P>
        <H2 id="environments">Environments</H2>
        <P>
          Every project has three environments: <C>development</C>, <C>staging</C> and <C>production</C>. Each one has
          its own content, configuration, flags and keys, so experimental changes never leak into production.
        </P>
        <Code title="Typical flow">{`development  ->  staging  ->  production`}</Code>
        <P>
          Use the environment switcher in the dashboard sidebar to move between them. Everything you edit applies to
          the selected environment only.
        </P>
        <H2 id="keys">Keys</H2>
        <P>
          Keys are scoped to a single environment. The key you use in your app decides which environment it reads
          from. See <Link className="text-primary underline underline-offset-4" href="/docs/security">Security</Link> for
          the difference between delivery and admin keys.
        </P>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "content-types",
    title: "Content types",
    group: "Concepts",
    summary: "Define the shape of your content with fields and schemas.",
    headings: [
      { id: "fields", label: "Field types" },
      { id: "lifecycle", label: "Draft and publish" },
      { id: "primitives", label: "Mobile primitives" },
    ],
    body: (
      <>
        <P>
          A content type is a schema. It lists the fields an entry can have. For example, an <C>Article</C> might
          have a title, a slug, a body, a cover image, an author reference and a published flag.
        </P>
        <H2 id="fields">Field types</H2>
        <Table
          head={["Type", "Use it for"]}
          rows={[
            [<C key="1">Text</C>, "Short strings such as titles and slugs"],
            [<C key="2">Long Text</C>, "Paragraphs and descriptions"],
            [<C key="3">Number</C>, "Prices, counts, ordering"],
            [<C key="4">Boolean</C>, "Simple on/off values"],
            [<C key="5">Date</C>, "Event times, publish dates"],
            [<C key="6">Image</C>, "A media reference with width, height and URL"],
            [<C key="7">File</C>, "Documents and downloads"],
            [<C key="8">Rich Text</C>, "Formatted body content"],
            [<C key="9">Reference</C>, "A link to another entry, such as an author"],
            [<C key="10">List</C>, "An ordered collection of values"],
            [<C key="11">Object</C>, "A nested group of fields"],
          ]}
        />
        <H2 id="lifecycle">Draft and publish</H2>
        <P>Every entry is in one of two states.</P>
        <Code>{`Draft  --Publish-->  Published  --Unpublish-->  Draft`}</Code>
        <P>
          The delivery API only returns <C>published</C> entries. Draft work stays private until you are ready, and
          unpublishing removes an entry from your app on its next refresh.
        </P>
        <H2 id="primitives">Mobile primitives</H2>
        <P>
          Common mobile structures such as banners, announcements, FAQs, products, events and onboarding slides will
          ship as ready-made templates. They never replace custom schemas. They just make the common cases faster.
        </P>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "content-api",
    title: "Fetching content",
    group: "Guides",
    summary: "List and get entries with the SDK, and understand the response shape.",
    headings: [
      { id: "list", label: "List entries" },
      { id: "get", label: "Get one entry" },
      { id: "shape", label: "Response shape" },
      { id: "meta", label: "Source metadata" },
    ],
    body: (
      <>
        <H2 id="list">List entries</H2>
        <Code>{`
const res = await unit.content("articles").list({ limit: 10 })

res.data.forEach((article) => {
  console.log(article.attributes.title)
})
`}</Code>
        <H2 id="get">Get one entry</H2>
        <Code>{`const article = await unit.content("articles").get("article_123")`}</Code>
        <H2 id="shape">Response shape</H2>
        <P>
          Responses are predictable and versioned. Each entry has an <C>id</C>, a <C>type</C> and an{" "}
          <C>attributes</C> object that matches your schema.
        </P>
        <Code title="Response">{`
{
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
}
`}</Code>
        <H2 id="meta">Source metadata</H2>
        <P>
          The SDK adds a <C>source</C> field so your UI can react to where the data came from.
        </P>
        <Table
          head={["source", "Meaning"]}
          rows={[
            [<C key="1">network</C>, "Fresh from the API"],
            [<C key="2">cache</C>, "From the local cache, revalidation in progress or skipped"],
            [<C key="3">offline</C>, "The network is unreachable, so the last known content is returned"],
          ]}
        />
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "remote-config",
    title: "Remote config",
    group: "Guides",
    summary: "Change app behaviour without a release using typed values.",
    headings: [
      { id: "types", label: "Value types" },
      { id: "read", label: "Reading config" },
      { id: "patterns", label: "Common patterns" },
    ],
    body: (
      <>
        <P>
          Remote config lets you change simple application values without shipping a new version. Think of it as a
          typed settings file your app downloads.
        </P>
        <H2 id="types">Value types</H2>
        <Table
          head={["Type", "Example"]}
          rows={[
            [<C key="1">string</C>, "support@example.com"],
            [<C key="2">number</C>, "1500"],
            [<C key="3">boolean</C>, "false"],
            [<C key="4">json</C>, "{ \"columns\": 2 }"],
          ]}
        />
        <H2 id="read">Reading config</H2>
        <Code>{`
const config = await unit.config.get()

config.maintenance_mode   // false
config.delivery_fee       // 1500
config.home_layout        // { columns: 2 }
`}</Code>
        <H2 id="patterns">Common patterns</H2>
        <H3>Maintenance mode</H3>
        <Code>{`
if (config.maintenance_mode) {
  return <MaintenanceScreen />
}
`}</Code>
        <H3>Minimum app version</H3>
        <P>
          Store <C>minimum_app_version</C> as a string and compare it against the installed version at launch to
          prompt for an update.
        </P>
        <Note>
          Config is delivered to every user of an environment. For per-user targeting, wait for the targeting rules
          on the roadmap.
        </Note>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "feature-flags",
    title: "Feature flags",
    group: "Guides",
    summary: "Switch functionality on and off remotely.",
    headings: [
      { id: "using", label: "Using a flag" },
      { id: "behaviour", label: "Behaviour" },
      { id: "next", label: "What is coming" },
    ],
    body: (
      <>
        <H2 id="using">Using a flag</H2>
        <Code>{`
const enabled = unit.flag("new_checkout")

return enabled ? <NewCheckout /> : <Checkout />
`}</Code>
        <P>
          Flags are read synchronously from the in-memory copy, so they are safe to call during render. They are
          loaded when the SDK starts and refreshed in the background.
        </P>
        <H2 id="behaviour">Behaviour</H2>
        <UL>
          <li>Flags are boolean in the MVP.</li>
          <li>An unknown flag returns <C>false</C>.</li>
          <li>Flags are per environment. Enabling one in staging does not touch production.</li>
        </UL>
        <H2 id="next">What is coming</H2>
        <P>Percentage rollouts, user targeting, app-version targeting and scheduled activation.</P>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "caching-and-offline",
    title: "Caching & offline",
    group: "Guides",
    summary: "How the SDK renders instantly and keeps working without a connection.",
    headings: [
      { id: "swr", label: "Stale while revalidate" },
      { id: "layers", label: "Cache layers" },
      { id: "offline", label: "Offline" },
      { id: "http", label: "HTTP caching" },
    ],
    body: (
      <>
        <H2 id="swr">Stale while revalidate</H2>
        <P>
          When cached data exists, the SDK returns it immediately and refreshes it in the background. Your UI gets
          content on the first frame and updates when newer data arrives.
        </P>
        <Code>{`Cache  ->  render immediately  ->  network request  ->  update cache  ->  update app`}</Code>
        <H2 id="layers">Cache layers</H2>
        <Code>{`Memory  ->  Persistent storage  ->  Network`}</Code>
        <P>
          The memory layer avoids repeated disk reads during a session. The persistent layer survives app restarts.
        </P>
        <H2 id="offline">Offline</H2>
        <P>
          If the network is unavailable, the SDK checks the local cache and returns what it has, marked with{" "}
          <C>source: &quot;offline&quot;</C>. An empty screen is the last resort, not the default.
        </P>
        <Code>{`
const home = await unit.content("home").get()

if (home.meta.source === "offline") {
  showOfflineBanner()
}
`}</Code>
        <H2 id="http">HTTP caching</H2>
        <P>
          The API sends <C>Cache-Control</C>, <C>ETag</C> and <C>Last-Modified</C> headers. The SDK uses them for
          conditional requests, so unchanged content costs a tiny <C>304</C> response.
        </P>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "sdk-react-native",
    title: "React Native SDK",
    group: "Reference",
    summary: "Install and configure @unitcms/react-native.",
    headings: [
      { id: "install", label: "Install" },
      { id: "init", label: "Initialize" },
      { id: "methods", label: "Methods" },
      { id: "types", label: "Generated types" },
    ],
    body: (
      <>
        <H2 id="install">Install</H2>
        <Code title="terminal">{`npx expo install @unitcms/react-native @react-native-async-storage/async-storage`}</Code>
        <P>Expo is fully supported, and so is a bare React Native app.</P>
        <H2 id="init">Initialize</H2>
        <Code>{`
import { Unit } from "@unitcms/react-native"

const unit = Unit({
  project: "proj_123",
  token: "unit_prod_pub_..."
})
`}</Code>
        <Table
          head={["Option", "Type", "Description"]}
          rows={[
            [<C key="1">project</C>, "string", "Your project ID"],
            [<C key="2">token</C>, "string", "A delivery key for one environment"],
          ]}
        />
        <H2 id="methods">Methods</H2>
        <Table
          head={["Method", "Returns"]}
          rows={[
            [<C key="1">unit.content(type).list(options?)</C>, "Published entries of a type"],
            [<C key="2">unit.content(type).get(id)</C>, "A single published entry"],
            [<C key="3">unit.config.get()</C>, "Typed config values"],
            [<C key="4">unit.flag(key)</C>, "A boolean, synchronously"],
          ]}
        />
        <H2 id="types">Generated types</H2>
        <P>
          Type generation is on the roadmap. The goal is one command that turns your schemas into TypeScript types.
        </P>
        <Code title="Planned">{`npx unitcms generate`}</Code>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "rest-api",
    title: "REST API",
    group: "Reference",
    summary: "The HTTP endpoints behind the SDK.",
    headings: [
      { id: "auth", label: "Authentication" },
      { id: "content", label: "Content" },
      { id: "config", label: "Config" },
      { id: "flags", label: "Flags" },
      { id: "admin", label: "Management API" },
      { id: "caching", label: "Caching headers" },
      { id: "errors", label: "Errors" },
    ],
    body: (
      <>
        <P>
          The SDK is a thin layer over a plain REST API. You can call it directly from anywhere. All endpoints are
          prefixed with <C>/v1</C> and return JSON.
        </P>
        <H2 id="auth">Authentication</H2>
        <Code>{`
curl https://api.unitcms.dev/v1/projects/proj_123/content/articles \\
  -H "Authorization: Bearer unit_prod_pub_..."
`}</Code>
        <H2 id="content">Content</H2>
        <Code>{`
GET /v1/projects/:projectId/content/:type
GET /v1/projects/:projectId/content/:type/:id
`}</Code>
        <P>
          Only published entries are returned by default. Supports <C>limit</C> as a query parameter.
        </P>
        <H2 id="config">Config</H2>
        <Code>{`GET /v1/projects/:projectId/config`}</Code>
        <H2 id="flags">Flags</H2>
        <Code>{`GET /v1/projects/:projectId/flags`}</Code>
        <H2 id="admin">Management API</H2>
        <P>
          Everything the dashboard does is available over HTTP with an <strong>admin key</strong>. Admin routes live
          under <C>/v1/projects/:projectId/admin</C> and apply to the environment the key belongs to. Never put an
          admin key in a mobile app.
        </P>
        <Table
          head={["Resource", "Endpoints"]}
          rows={[
            [<C key="1">types</C>, "GET, POST /types · PUT, DELETE /types/:name"],
            [<C key="2">entries</C>, "GET, POST /entries · GET, PATCH, DELETE /entries/:id · POST /entries/:id/publish and /unpublish"],
            [<C key="3">config</C>, "GET /config · PUT, DELETE /config/:key"],
            [<C key="4">flags</C>, "GET /flags · PUT, DELETE /flags/:key"],
            [<C key="5">media</C>, "GET, POST /media · DELETE /media/:id"],
            [<C key="6">keys</C>, "GET, POST /keys · DELETE /keys/:id (revokes)"],
          ]}
        />
        <Code title="Create and publish an entry">{`
curl -X POST https://api.unitcms.dev/v1/projects/proj_123/admin/entries \\
  -H "Authorization: Bearer unit_prod_adm_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "type": "articles", "data": { "title": "Hello" }, "status": "published" }'
`}</Code>
        <P>
          Drafts can be saved incomplete. Required fields in the content type are enforced when you publish, and
          unknown fields are always rejected.
        </P>
        <H2 id="caching">Caching headers</H2>
        <P>
          Delivery responses include an <C>ETag</C> and <C>Cache-Control: private, max-age=15,
          stale-while-revalidate=300</C>. Send <C>If-None-Match</C> to get a <C>304</C> when nothing changed.
        </P>
        <H2 id="errors">Errors</H2>
        <P>
          Errors use one shape: <C>{`{ "error": { "code", "message", "issues"? } }`}</C>.
        </P>
        <Table
          head={["Status", "Meaning"]}
          rows={[
            [<C key="1">401</C>, "Missing or invalid key"],
            [<C key="2">403</C>, "The key cannot access this project or environment"],
            [<C key="3">404</C>, "Unknown project, type or entry"],
            [<C key="4">429</C>, "Too many requests"],
          ]}
        />
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "security",
    title: "Security",
    group: "Reference",
    summary: "What is safe to ship in your app, and what must stay on a server.",
    headings: [
      { id: "model", label: "The model" },
      { id: "keys", label: "Key types" },
      { id: "never", label: "Never expose" },
    ],
    body: (
      <>
        <H2 id="model">The model</H2>
        <P>
          Mobile apps cannot hide secrets. Anything in your bundle can be extracted. UnitCMS is designed around that
          fact: the key in your app can only read published content.
        </P>
        <Code>{`Mobile SDK  ->  read-only delivery key  ->  published content only`}</Code>
        <H2 id="keys">Key types</H2>
        <Table
          head={["Key", "Can do", "Where it lives"]}
          rows={[
            ["Delivery", "Read published content, config and flags", "Your mobile app"],
            ["Admin", "Create, edit, publish and delete", "Your server only"],
          ]}
        />
        <P>The API enforces project and environment isolation on every request.</P>
        <H2 id="never">Never expose</H2>
        <UL>
          <li>Admin API keys</li>
          <li>Database or storage credentials</li>
          <li>Any credential that can edit content</li>
        </UL>
      </>
    ),
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "roadmap",
    title: "Roadmap",
    group: "Reference",
    summary: "What is shipping next.",
    headings: [
      { id: "flags", label: "Flags" },
      { id: "content", label: "Content" },
      { id: "mobile", label: "Mobile" },
      { id: "dx", label: "Developer experience" },
    ],
    body: (
      <>
        <H2 id="flags">Flags</H2>
        <UL>
          <li>Percentage rollout</li>
          <li>User, device and app-version targeting</li>
        </UL>
        <H2 id="content">Content</H2>
        <UL>
          <li>Scheduled publishing and content versioning</li>
          <li>Preview API</li>
          <li>Localization</li>
        </UL>
        <H2 id="mobile">Mobile</H2>
        <UL>
          <li>App version management with update prompts</li>
          <li>Offline synchronization and background refresh</li>
          <li>Push notifications and deep-link configuration</li>
        </UL>
        <H2 id="dx">Developer experience</H2>
        <UL>
          <li>CLI and generated TypeScript types</li>
          <li>Expo plugin and React hooks</li>
          <li>React Query integration and webhooks</li>
        </UL>
      </>
    ),
  },
]

export const groups = Array.from(new Set(docs.map((d) => d.group)))
