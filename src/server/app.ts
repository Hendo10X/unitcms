import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { eq } from "drizzle-orm"
import { getDb, schema } from "./db"
import { auth } from "./routes/auth"
import { ApiError, errorBody, type AppEnv } from "./lib"
import { admin } from "./routes/admin"
import { delivery } from "./routes/delivery"
import { projects } from "./routes/projects"

export const app = new Hono<AppEnv>().basePath("/api")

// Mobile clients are not browsers, but web previews and the dashboard are.
app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type", "If-None-Match"], exposeHeaders: ["ETag"], maxAge: 86400 }))

// Cookie-authenticated writes must come from our own site. (Key-based calls send a bearer token instead.)
app.use("*", async (c, next) => {
  const method = c.req.method
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && !c.req.header("authorization")) {
    const origin = c.req.header("origin")
    const host = c.req.header("x-forwarded-host") ?? c.req.header("host")
    if (origin && host) {
      let originHost = ""
      try {
        originHost = new URL(origin).host
      } catch {}
      if (originHost !== host) throw new ApiError(403, "cross_site", "Cross-site requests are not allowed.")
    }
  }
  await next()
})

app.use("*", async (c, next) => {
  c.set("db", await getDb())
  await next()
})

app.get("/v1/health", (c) => c.json({ ok: true }))

app.route("/v1/auth", auth)
app.route("/v1/projects", projects)

// Public, immutable file bytes for media uploaded through the dashboard.
app.get("/v1/files/:id", async (c) => {
  const [row] = await c
    .get("db")
    .select({ data: schema.media.data, mimeType: schema.media.mimeType })
    .from(schema.media)
    .where(eq(schema.media.id, c.req.param("id")))
    .limit(1)
  if (!row?.data) throw new ApiError(404, "not_found", "No such file.")
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // Uploaded files are untrusted: never let them run scripts on our origin.
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Access-Control-Allow-Origin": "*",
    },
  })
})
app.route("/v1/projects/:projectId/admin", admin)
app.route("/v1/projects/:projectId", delivery)

app.notFound((c) => c.json(errorBody("not_found", "No such endpoint."), 404))

app.onError((err, c) => {
  if (err instanceof ApiError) return c.json(errorBody(err.code, err.message, err.issues), err.status)
  if (err instanceof HTTPException) return c.json(errorBody("http_error", err.message), err.status)
  console.error(err)
  return c.json(errorBody("internal_error", "Something went wrong on our side."), 500)
})

export type App = typeof app
