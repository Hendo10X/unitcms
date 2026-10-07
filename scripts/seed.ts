/**
 * Creates a demo project with content, config and flags, and prints its keys.
 *   npm run db:seed
 * Uses DATABASE_URL if set, otherwise the embedded PGlite database in .data/pglite.
 */
try {
  process.loadEnvFile(".env.local")
} catch {}
process.env.UNITCMS_MASTER_KEY ??= "dev_master_key"

import { app } from "../src/server/app"

const base = "/api/v1"
const call = async (path: string, key: string, method = "GET", json?: unknown) => {
  const res = await app.request(base + path, {
    method,
    headers: { authorization: `Bearer ${key}`, ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(json) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

async function main() {
  const { data } = await call("/projects", process.env.UNITCMS_MASTER_KEY!, "POST", { name: "Shop App" })
  const pid = data.project.id as string
  const prod = data.environments.find((e: { name: string }) => e.name === "production")
  const admin = prod.keys.admin as string
  const p = (path: string) => `/projects/${pid}/admin${path}`

  await call(p("/types"), admin, "POST", {
    name: "articles",
    label: "Article",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "body", type: "richText" },
    ],
  })
  await call(p("/types"), admin, "POST", {
    name: "banners",
    label: "Banner",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "cta", type: "text" },
    ],
  })

  const publish = async (type: string, d: Record<string, unknown>) => {
    const r = await call(p("/entries"), admin, "POST", { type, data: d, status: "published" })
    return r.data.id as string
  }
  await publish("articles", { title: "Welcome to UnitCMS", slug: "welcome-to-unitcms", body: "Ship content without shipping an update." })
  await publish("banners", { title: "Free delivery weekend", cta: "Order now" })
  await call(p("/entries"), admin, "POST", { type: "articles", data: { title: "Draft: our new checkout", slug: "new-checkout" } })

  const put = (kind: "config" | "flags", key: string, body: unknown) => call(p(`/${kind}/${key}`), admin, "PUT", body)
  await put("config", "delivery_fee", { type: "number", value: 1500 })
  await put("config", "maintenance_mode", { type: "boolean", value: false })
  await put("config", "support_email", { type: "string", value: "support@example.com" })
  await put("flags", "new_checkout", { enabled: true, description: "Redesigned checkout flow" })
  await put("flags", "map_tracking", { enabled: false, description: "Live order tracking" })

  console.log(`
Project   ${pid}
Env       production

Delivery key (safe in your app)
  ${prod.keys.delivery}
Admin key (server only)
  ${admin}

Try it:
  curl http://localhost:3000/v1/projects/${pid}/content/articles -H "Authorization: Bearer ${prod.keys.delivery}"
`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
