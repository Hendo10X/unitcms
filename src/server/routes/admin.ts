import { Hono } from "hono"
import { and, asc, count, desc, eq, getTableColumns, gte, sql } from "drizzle-orm"
import { z } from "zod"
import { schema } from "../db"
import {
  ApiError,
  checkConfigValue,
  checkEntryData,
  generateKey,
  newId,
  validate,
  type AppEnv,
} from "../lib"
import { requireAdmin } from "../middleware"
import { findType, serializeEntry } from "./delivery"

const { contentEntries, contentTypes, contentVersions, configItems, featureFlags, media, apiKeys } = schema

/** Management API. Needs an admin key, which must only ever live on your server. */
export const admin = new Hono<AppEnv>()
admin.use("*", requireAdmin)

/* ------------------------------------------------------------------ */
/* Content types                                                       */
/* ------------------------------------------------------------------ */

const fieldSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Use letters, numbers and underscores"),
  type: z.enum(["text", "longText", "number", "boolean", "date", "image", "file", "richText", "reference", "list", "object"]),
  required: z.boolean().optional(),
})

const typeBody = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_-]*$/, "Lowercase letters, numbers, - and _"),
  label: z.string().min(1).max(80),
  fields: z.array(fieldSchema).max(60).default([]),
})

admin.get("/types", async (c) => {
  const rows = await c.get("db").select().from(contentTypes).where(eq(contentTypes.projectId, c.get("key").projectId)).orderBy(asc(contentTypes.name))
  return c.json({ data: rows, meta: { count: rows.length } })
})

admin.post("/types", validate("json", typeBody), async (c) => {
  const body = c.req.valid("json")
  const names = body.fields.map((f) => f.name)
  if (new Set(names).size !== names.length) throw new ApiError(422, "duplicate_field", "Field names must be unique.")
  const db = c.get("db")
  const projectId = c.get("key").projectId
  const [existing] = await db.select({ id: contentTypes.id }).from(contentTypes).where(and(eq(contentTypes.projectId, projectId), eq(contentTypes.name, body.name))).limit(1)
  if (existing) throw new ApiError(409, "type_exists", `A content type called "${body.name}" already exists.`)
  const [row] = await db.insert(contentTypes).values({ id: newId("type"), projectId, ...body }).returning()
  return c.json({ data: row }, 201)
})

admin.put("/types/:name", validate("json", typeBody.omit({ name: true }).partial()), async (c) => {
  const body = c.req.valid("json")
  const db = c.get("db")
  const type = await findType(db, c.get("key").projectId, c.req.param("name")!)
  const [row] = await db.update(contentTypes).set(body).where(eq(contentTypes.id, type.id)).returning()
  return c.json({ data: row })
})

admin.delete("/types/:name", async (c) => {
  const db = c.get("db")
  const type = await findType(db, c.get("key").projectId, c.req.param("name")!)
  await db.delete(contentTypes).where(eq(contentTypes.id, type.id))
  return c.body(null, 204)
})

/* ------------------------------------------------------------------ */
/* Entries                                                             */
/* ------------------------------------------------------------------ */

const dataSchema = z.record(z.string(), z.unknown())

const entryQuery = z.object({
  type: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(["updated", "created", "published"]).default("updated"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

async function loadEntry(c: { get: (k: "db") => AppEnv["Variables"]["db"]; req: { param: (k: string) => string | undefined } }, environmentId: string) {
  const db = c.get("db")
  const [row] = await db
    .select({ entry: contentEntries, typeName: contentTypes.name, fields: contentTypes.fields })
    .from(contentEntries)
    .innerJoin(contentTypes, eq(contentTypes.id, contentEntries.typeId))
    .where(and(eq(contentEntries.id, c.req.param("id")!), eq(contentEntries.environmentId, environmentId)))
    .limit(1)
  if (!row) throw new ApiError(404, "not_found", "No entry with that id in this environment.")
  return row
}

admin.get("/entries", validate("query", entryQuery), async (c) => {
  const key = c.get("key")
  const q = c.req.valid("query")
  const db = c.get("db")

  const conditions = [eq(contentEntries.environmentId, key.environmentId), eq(contentTypes.projectId, key.projectId)]
  if (q.type) conditions.push(eq(contentTypes.name, q.type))
  if (q.status) conditions.push(eq(contentEntries.status, q.status))
  if (q.q) conditions.push(sql`${contentEntries.data}::text ilike ${"%" + q.q.replace(/[%_\\]/g, "\\$&") + "%"}`)
  const where = and(...conditions)

  const order =
    q.sort === "created" ? desc(contentEntries.createdAt) : q.sort === "published" ? desc(contentEntries.publishedAt) : desc(contentEntries.updatedAt)

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ entry: contentEntries, typeName: contentTypes.name })
      .from(contentEntries)
      .innerJoin(contentTypes, eq(contentTypes.id, contentEntries.typeId))
      .where(where)
      .orderBy(order)
      .limit(q.limit)
      .offset(q.offset),
    db.select({ total: count() }).from(contentEntries).innerJoin(contentTypes, eq(contentTypes.id, contentEntries.typeId)).where(where),
  ])
  return c.json({
    data: rows.map((r) => serializeEntry(r.entry, r.typeName)),
    meta: { count: rows.length, total, limit: q.limit, offset: q.offset },
  })
})

admin.get("/entries/:id", async (c) => {
  const { entry, typeName } = await loadEntry(c, c.get("key").environmentId)
  return c.json({ data: serializeEntry(entry, typeName) })
})

admin.post(
  "/entries",
  validate("json", z.object({ type: z.string(), data: dataSchema.default({}), status: z.enum(["draft", "published"]).default("draft") })),
  async (c) => {
    const key = c.get("key")
    const body = c.req.valid("json")
    const db = c.get("db")
    const type = await findType(db, key.projectId, body.type)

    const problems = checkEntryData(type.fields, body.data, body.status === "published")
    if (problems.length) throw new ApiError(422, "invalid_entry", "The entry does not match its content type.", problems)

    const id = newId(type.name.replace(/s$/, "").replace(/[^a-z0-9]/g, ""))
    const [row] = await db
      .insert(contentEntries)
      .values({
        id,
        environmentId: key.environmentId,
        typeId: type.id,
        data: body.data,
        status: body.status,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning()
    await db.insert(contentVersions).values({ id: newId("ver"), entryId: id, data: body.data })
    return c.json({ data: serializeEntry(row, type.name) }, 201)
  },
)

admin.patch("/entries/:id", validate("json", z.object({ data: dataSchema })), async (c) => {
  const key = c.get("key")
  const db = c.get("db")
  const { entry, typeName, fields } = await loadEntry(c, key.environmentId)
  const merged = { ...entry.data, ...c.req.valid("json").data }
  // Setting a field to null clears it.
  for (const k of Object.keys(merged)) if (merged[k] === null) delete merged[k]

  const problems = checkEntryData(fields, merged, entry.status === "published")
  if (problems.length) throw new ApiError(422, "invalid_entry", "The entry does not match its content type.", problems)

  const [row] = await db.update(contentEntries).set({ data: merged, updatedAt: new Date() }).where(eq(contentEntries.id, entry.id)).returning()
  await db.insert(contentVersions).values({ id: newId("ver"), entryId: entry.id, data: merged })
  return c.json({ data: serializeEntry(row, typeName) })
})

admin.post("/entries/:id/publish", async (c) => {
  const db = c.get("db")
  const { entry, typeName, fields } = await loadEntry(c, c.get("key").environmentId)
  const problems = checkEntryData(fields, entry.data, true)
  if (problems.length) throw new ApiError(422, "invalid_entry", "Fix these fields before publishing.", problems)
  const [row] = await db
    .update(contentEntries)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(contentEntries.id, entry.id))
    .returning()
  return c.json({ data: serializeEntry(row, typeName) })
})

admin.post("/entries/:id/unpublish", async (c) => {
  const db = c.get("db")
  const { entry, typeName } = await loadEntry(c, c.get("key").environmentId)
  const [row] = await db
    .update(contentEntries)
    .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
    .where(eq(contentEntries.id, entry.id))
    .returning()
  return c.json({ data: serializeEntry(row, typeName) })
})

admin.delete("/entries/:id", async (c) => {
  const { entry } = await loadEntry(c, c.get("key").environmentId)
  await c.get("db").delete(contentEntries).where(eq(contentEntries.id, entry.id))
  return c.body(null, 204)
})

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const keyName = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/, "Letters, numbers, _ . - and up to 64 characters")

admin.get("/config", async (c) => {
  const rows = await c.get("db").select().from(configItems).where(eq(configItems.environmentId, c.get("key").environmentId)).orderBy(asc(configItems.key))
  return c.json({ data: rows, meta: { count: rows.length } })
})

admin.put(
  "/config/:key",
  validate("json", z.object({ type: z.enum(["string", "number", "boolean", "json"]), value: z.unknown() })),
  async (c) => {
    const key = keyName.safeParse(c.req.param("key"))
    if (!key.success) throw new ApiError(400, "invalid_key_name", key.error.issues[0].message)
    const body = c.req.valid("json")
    if (!checkConfigValue(body.type, body.value)) {
      throw new ApiError(422, "invalid_value", `The value is not a valid ${body.type}.`)
    }
    const environmentId = c.get("key").environmentId
    const [row] = await c
      .get("db")
      .insert(configItems)
      .values({ environmentId, key: key.data, type: body.type, value: body.value })
      .onConflictDoUpdate({ target: [configItems.environmentId, configItems.key], set: { type: body.type, value: body.value, updatedAt: new Date() } })
      .returning()
    return c.json({ data: row })
  },
)

admin.delete("/config/:key", async (c) => {
  await c.get("db").delete(configItems).where(and(eq(configItems.environmentId, c.get("key").environmentId), eq(configItems.key, c.req.param("key")!)))
  return c.body(null, 204)
})

/* ------------------------------------------------------------------ */
/* Feature flags                                                       */
/* ------------------------------------------------------------------ */

admin.get("/flags", async (c) => {
  const rows = await c.get("db").select().from(featureFlags).where(eq(featureFlags.environmentId, c.get("key").environmentId)).orderBy(asc(featureFlags.key))
  return c.json({ data: rows, meta: { count: rows.length } })
})

admin.put(
  "/flags/:key",
  validate("json", z.object({ enabled: z.boolean(), description: z.string().max(200).optional() })),
  async (c) => {
    const key = keyName.safeParse(c.req.param("key"))
    if (!key.success) throw new ApiError(400, "invalid_key_name", key.error.issues[0].message)
    const body = c.req.valid("json")
    const environmentId = c.get("key").environmentId
    const [row] = await c
      .get("db")
      .insert(featureFlags)
      .values({ environmentId, key: key.data, enabled: body.enabled, description: body.description ?? "" })
      .onConflictDoUpdate({
        target: [featureFlags.environmentId, featureFlags.key],
        set: { enabled: body.enabled, ...(body.description !== undefined ? { description: body.description } : {}), updatedAt: new Date() },
      })
      .returning()
    return c.json({ data: row })
  },
)

admin.delete("/flags/:key", async (c) => {
  await c.get("db").delete(featureFlags).where(and(eq(featureFlags.environmentId, c.get("key").environmentId), eq(featureFlags.key, c.req.param("key")!)))
  return c.body(null, 204)
})

/* ------------------------------------------------------------------ */
/* Media (metadata)                                                    */
/* ------------------------------------------------------------------ */

// Never select the file bytes when listing.
const { data: _bytes, ...mediaCols } = getTableColumns(media)

const MAX_UPLOAD = 4 * 1024 * 1024

admin.get("/media", async (c) => {
  const rows = await c.get("db").select(mediaCols).from(media).where(eq(media.projectId, c.get("key").projectId)).orderBy(desc(media.createdAt))
  return c.json({ data: rows, meta: { count: rows.length } })
})

/** Multipart upload (field `file`, optional `width` and `height`). Files are stored in Postgres, up to 4 MB. */
admin.post("/media/upload", async (c) => {
  const form = await c.req.parseBody()
  const file = form.file
  if (!(file instanceof File)) throw new ApiError(400, "missing_file", "Send the file in a multipart field called `file`.")
  if (file.size > MAX_UPLOAD) throw new ApiError(413, "file_too_large", "Files can be up to 4 MB.")
  const dim = (v: unknown) => {
    const n = Number(v)
    return Number.isInteger(n) && n > 0 && n < 100_000 ? n : undefined
  }
  const id = newId("media")
  const [row] = await c
    .get("db")
    .insert(media)
    .values({
      id,
      projectId: c.get("key").projectId,
      filename: file.name.slice(0, 200) || "file",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      width: dim(form.width),
      height: dim(form.height),
      url: `${new URL(c.req.url).origin}/v1/files/${id}`,
      data: Buffer.from(await file.arrayBuffer()),
    })
    .returning(mediaCols)
  return c.json({ data: row }, 201)
})

/* ------------------------------------------------------------------ */
/* Project and overview                                                */
/* ------------------------------------------------------------------ */

admin.get("/project", async (c) => {
  const [row] = await c.get("db").select().from(schema.projects).where(eq(schema.projects.id, c.get("key").projectId)).limit(1)
  return c.json({ data: { id: row.id, name: row.name, createdAt: row.createdAt } })
})

admin.patch("/project", validate("json", z.object({ name: z.string().trim().min(1).max(80) })), async (c) => {
  const [row] = await c
    .get("db")
    .update(schema.projects)
    .set({ name: c.req.valid("json").name })
    .where(eq(schema.projects.id, c.get("key").projectId))
    .returning()
  return c.json({ data: { id: row.id, name: row.name, createdAt: row.createdAt } })
})

admin.get("/overview", async (c) => {
  const db = c.get("db")
  const { environmentId, projectId } = c.get("key")
  // 24 hourly buckets ending with the current hour.
  const since = new Date()
  since.setMinutes(0, 0, 0)
  since.setTime(since.getTime() - 23 * 3_600_000)

  const [[types], [entries], [published], [flags], [flagsOn], [cfg], [files], usageRows] = await Promise.all([
    db.select({ n: count() }).from(contentTypes).where(eq(contentTypes.projectId, projectId)),
    db.select({ n: count() }).from(contentEntries).where(eq(contentEntries.environmentId, environmentId)),
    db.select({ n: count() }).from(contentEntries).where(and(eq(contentEntries.environmentId, environmentId), eq(contentEntries.status, "published"))),
    db.select({ n: count() }).from(featureFlags).where(eq(featureFlags.environmentId, environmentId)),
    db.select({ n: count() }).from(featureFlags).where(and(eq(featureFlags.environmentId, environmentId), eq(featureFlags.enabled, true))),
    db.select({ n: count() }).from(configItems).where(eq(configItems.environmentId, environmentId)),
    db.select({ n: count() }).from(media).where(eq(media.projectId, projectId)),
    db.select().from(schema.usage).where(and(eq(schema.usage.environmentId, environmentId), gte(schema.usage.bucket, since))),
  ])

  const byHour = new Map(usageRows.map((r) => [r.bucket.getTime(), r.count]))
  const series = Array.from({ length: 24 }, (_, i) => {
    const t = since.getTime() + i * 3_600_000
    return { t: new Date(t).toISOString(), count: byHour.get(t) ?? 0 }
  })

  return c.json({
    data: {
      types: types.n,
      entries: { total: entries.n, published: published.n },
      flags: { total: flags.n, enabled: flagsOn.n },
      config: cfg.n,
      media: files.n,
      requests: { total: series.reduce((s, p) => s + p.count, 0), series },
    },
  })
})

admin.post(
  "/media",
  validate(
    "json",
    z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      size: z.number().int().min(0),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      url: z.string().url(),
    }),
  ),
  async (c) => {
    const [row] = await c.get("db").insert(media).values({ id: newId("media"), projectId: c.get("key").projectId, ...c.req.valid("json") }).returning(mediaCols)
    return c.json({ data: row }, 201)
  },
)

admin.delete("/media/:id", async (c) => {
  await c.get("db").delete(media).where(and(eq(media.id, c.req.param("id")!), eq(media.projectId, c.get("key").projectId)))
  return c.body(null, 204)
})

/* ------------------------------------------------------------------ */
/* API keys (for the environment of the key making the request)        */
/* ------------------------------------------------------------------ */

admin.get("/keys", async (c) => {
  const rows = await c
    .get("db")
    .select({ id: apiKeys.id, kind: apiKeys.kind, label: apiKeys.label, prefix: apiKeys.prefix, createdAt: apiKeys.createdAt, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.environmentId, c.get("key").environmentId))
    .orderBy(desc(apiKeys.createdAt))
  return c.json({ data: rows, meta: { count: rows.length } })
})

admin.post("/keys", validate("json", z.object({ kind: z.enum(["delivery", "admin"]), label: z.string().max(80).default("") })), async (c) => {
  const key = c.get("key")
  const body = c.req.valid("json")
  const k = generateKey(key.environment, body.kind)
  const [row] = await c
    .get("db")
    .insert(apiKeys)
    .values({ id: newId("key"), environmentId: key.environmentId, kind: body.kind, label: body.label, prefix: k.prefix, hash: k.hash })
    .returning({ id: apiKeys.id, kind: apiKeys.kind, label: apiKeys.label, prefix: apiKeys.prefix })
  // The raw key is shown exactly once.
  return c.json({ data: { ...row, key: k.raw } }, 201)
})

admin.delete("/keys/:id", async (c) => {
  const key = c.get("key")
  if (c.req.param("id") === key.id) throw new ApiError(400, "self_revoke", "Use another admin key to revoke this one.")
  await c
    .get("db")
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, c.req.param("id")!), eq(apiKeys.environmentId, key.environmentId)))
  return c.body(null, 204)
})
