import { Hono } from "hono"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import { schema, type Db } from "../db"
import { getSessionUser } from "../auth"
import { ApiError, generateKey, newId, safeEqual, validate, type AppEnv } from "../lib"

const ENVIRONMENTS = ["development", "staging", "production"] as const

/**
 * Projects. Signed-in users create and list their own. `UNITCMS_MASTER_KEY` can also create
 * projects (for scripts and seeding) and receives admin keys as well as delivery keys.
 */
export const projects = new Hono<AppEnv>()

async function requireUser(c: Parameters<typeof getSessionUser>[0]) {
  const user = await getSessionUser(c)
  if (!user) throw new ApiError(401, "not_signed_in", "Sign in to continue.")
  return user
}

projects.get("/", async (c) => {
  const user = await requireUser(c)
  const rows = await c
    .get("db")
    .select({ id: schema.projects.id, name: schema.projects.name, createdAt: schema.projects.createdAt })
    .from(schema.projects)
    .where(eq(schema.projects.ownerId, user.id))
    .orderBy(desc(schema.projects.createdAt))
  return c.json({ data: rows, meta: { count: rows.length } })
})

projects.post(
  "/",
  validate("json", z.object({ name: z.string().trim().min(1).max(80), example: z.boolean().default(false) })),
  async (c) => {
    const { name, example } = c.req.valid("json")
    const db = c.get("db")

    // Who is asking: the master key, or a signed-in user.
    const token = (c.req.header("authorization") ?? "").replace(/^Bearer\s+/, "")
    const master = process.env.UNITCMS_MASTER_KEY
    let ownerId: string | null = null
    let isMaster = false
    if (token) {
      if (!master) throw new ApiError(503, "not_configured", "Set UNITCMS_MASTER_KEY on the server to create projects with a key.")
      if (!safeEqual(token, master)) throw new ApiError(401, "invalid_key", "Invalid master key.")
      isMaster = true
    } else {
      ownerId = (await requireUser(c)).id
    }

    const projectId = newId("proj")
    const result = await db.transaction(async (tx) => {
      await tx.insert(schema.projects).values({ id: projectId, name, ownerId })
      const out = []
      for (const env of ENVIRONMENTS) {
        const envId = newId("env")
        await tx.insert(schema.environments).values({ id: envId, projectId, name: env })
        const keys: Partial<Record<"delivery" | "admin", string>> = {}
        for (const kind of isMaster ? (["delivery", "admin"] as const) : (["delivery"] as const)) {
          const k = generateKey(env, kind)
          await tx.insert(schema.apiKeys).values({ id: newId("key"), environmentId: envId, kind, label: "Default", prefix: k.prefix, hash: k.hash })
          keys[kind] = k.raw
        }
        out.push({ id: envId, name: env, keys })
      }
      if (example) await seedExample(tx as unknown as Db, projectId, out.map((e) => e.id))
      return out
    })

    return c.json({ data: { project: { id: projectId, name }, environments: result } }, 201)
  },
)

projects.delete("/:id", async (c) => {
  const user = await requireUser(c)
  const res = await c
    .get("db")
    .delete(schema.projects)
    .where(and(eq(schema.projects.id, c.req.param("id")), eq(schema.projects.ownerId, user.id)))
    .returning({ id: schema.projects.id })
  if (!res.length) throw new ApiError(404, "not_found", "No such project.")
  return c.body(null, 204)
})

/** A small starter set so a new project shows something real straight away. */
async function seedExample(db: Db, projectId: string, environmentIds: string[]) {
  const articlesId = newId("type")
  const bannersId = newId("type")
  await db.insert(schema.contentTypes).values([
    {
      id: articlesId,
      projectId,
      name: "articles",
      label: "Article",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true },
        { name: "body", type: "longText" },
        { name: "featured", type: "boolean" },
      ],
    },
    {
      id: bannersId,
      projectId,
      name: "banners",
      label: "Banner",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "cta", type: "text" },
      ],
    },
  ])

  for (const environmentId of environmentIds) {
    const now = new Date()
    await db.insert(schema.contentEntries).values([
      { id: newId("article"), environmentId, typeId: articlesId, status: "published", publishedAt: now, data: { title: "Welcome to UnitCMS", slug: "welcome-to-unitcms", body: "Ship content without shipping an app update.", featured: true } },
      { id: newId("article"), environmentId, typeId: articlesId, status: "draft", data: { title: "Our new checkout", slug: "our-new-checkout", body: "A faster way to pay." } },
      { id: newId("banner"), environmentId, typeId: bannersId, status: "published", publishedAt: now, data: { title: "Free delivery weekend", cta: "Order now" } },
    ])
    await db.insert(schema.configItems).values([
      { environmentId, key: "maintenance_mode", type: "boolean", value: false },
      { environmentId, key: "delivery_fee", type: "number", value: 1500 },
      { environmentId, key: "support_email", type: "string", value: "support@example.com" },
    ])
    await db.insert(schema.featureFlags).values([
      { environmentId, key: "new_checkout", description: "Redesigned checkout flow", enabled: true },
      { environmentId, key: "map_tracking", description: "Live order tracking", enabled: false },
    ])
  }
}
