import { Hono } from "hono"
import { etag } from "hono/etag"
import { and, count, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { schema, type Db } from "../db"
import { ApiError, validate, type AppEnv } from "../lib"
import { requireKey } from "../middleware"

const { contentEntries, contentTypes, configItems, featureFlags } = schema

type EntryRow = typeof contentEntries.$inferSelect

export const serializeEntry = (e: EntryRow, typeName: string) => ({
  id: e.id,
  type: typeName,
  attributes: e.data,
  meta: {
    status: e.status,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    publishedAt: e.publishedAt,
  },
})

/** Read-only API used by the mobile SDK. Only published content is ever returned. */
export const delivery = new Hono<AppEnv>()

delivery.use("*", requireKey(["delivery", "admin"]))
// Count delivery requests per hour for the dashboard overview.
delivery.use("*", async (c, next) => {
  await next()
  if (c.req.method !== "GET" || (c.res.status !== 200 && c.res.status !== 304)) return
  const bucket = new Date()
  bucket.setMinutes(0, 0, 0)
  const { usage } = schema
  await c
    .get("db")
    .insert(usage)
    .values({ environmentId: c.get("key").environmentId, bucket, count: 1 })
    .onConflictDoUpdate({ target: [usage.environmentId, usage.bucket], set: { count: sql`${usage.count} + 1` } })
    .catch((e) => console.error("usage tracking failed", e))
})
delivery.use("*", etag())
delivery.use("*", async (c, next) => {
  await next()
  if (c.req.method === "GET" && c.res.status === 200) {
    // Keys are per environment, so responses are private. Devices may reuse them briefly and revalidate with the ETag.
    c.header("Cache-Control", "private, max-age=15, stale-while-revalidate=300")
    c.header("Vary", "Authorization")
  }
})

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function findType(db: Db, projectId: string, name: string) {
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(and(eq(contentTypes.projectId, projectId), eq(contentTypes.name, name)))
    .limit(1)
  if (!type) throw new ApiError(404, "unknown_type", `There is no content type called "${name}".`)
  return type
}

delivery.get("/content/:type", validate("query", listQuery), async (c) => {
  const key = c.get("key")
  const { limit, offset } = c.req.valid("query")
  const type = await findType(c.get("db"), key.projectId, c.req.param("type")!)
  const where = and(
    eq(contentEntries.environmentId, key.environmentId),
    eq(contentEntries.typeId, type.id),
    eq(contentEntries.status, "published"),
  )
  const db = c.get("db")
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(contentEntries).where(where).orderBy(desc(contentEntries.publishedAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(contentEntries).where(where),
  ])
  return c.json({
    data: rows.map((r) => serializeEntry(r, type.name)),
    meta: { count: rows.length, total, limit, offset },
  })
})

delivery.get("/content/:type/:id", async (c) => {
  const key = c.get("key")
  const type = await findType(c.get("db"), key.projectId, c.req.param("type")!)
  const [row] = await c
    .get("db")
    .select()
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.id, c.req.param("id")!),
        eq(contentEntries.environmentId, key.environmentId),
        eq(contentEntries.typeId, type.id),
        eq(contentEntries.status, "published"),
      ),
    )
    .limit(1)
  if (!row) throw new ApiError(404, "not_found", "No published entry with that id.")
  return c.json({ data: serializeEntry(row, type.name), meta: { count: 1 } })
})

delivery.get("/config", async (c) => {
  const rows = await c.get("db").select().from(configItems).where(eq(configItems.environmentId, c.get("key").environmentId))
  return c.json({
    data: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    meta: { count: rows.length },
  })
})

delivery.get("/flags", async (c) => {
  const rows = await c.get("db").select().from(featureFlags).where(eq(featureFlags.environmentId, c.get("key").environmentId))
  return c.json({
    data: Object.fromEntries(rows.map((r) => [r.key, r.enabled])),
    meta: { count: rows.length },
  })
})
