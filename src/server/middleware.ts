import { createMiddleware } from "hono/factory"
import { and, eq, isNull } from "drizzle-orm"
import { schema } from "./db"
import { getSessionUser } from "./auth"
import { ApiError, hashKey, type AppEnv } from "./lib"

const ENV_NAMES = ["development", "staging", "production"] as const

/**
 * Admin access for the management API. Accepts either an admin key (your server, scripts)
 * or a signed-in dashboard session. Sessions pick the environment with the `x-unit-env` header
 * and can only reach projects they own.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if ((c.req.header("authorization") ?? "").startsWith("Bearer ")) {
    return requireKey(["admin"])(c, next)
  }
  const user = await getSessionUser(c)
  if (!user) throw new ApiError(401, "missing_key", "Sign in, or send an admin key as `Authorization: Bearer <key>`.")

  const projectId = c.req.param("projectId")!
  const envName = c.req.header("x-unit-env") ?? "production"
  if (!(ENV_NAMES as readonly string[]).includes(envName)) throw new ApiError(400, "invalid_environment", "Unknown environment.")

  const [row] = await c
    .get("db")
    .select({ environmentId: schema.environments.id })
    .from(schema.environments)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.environments.projectId))
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.ownerId, user.id),
        eq(schema.environments.name, envName as (typeof ENV_NAMES)[number]),
      ),
    )
    .limit(1)
  if (!row) throw new ApiError(404, "not_found", "No such project.")

  c.set("userId", user.id)
  c.set("key", { id: "session", kind: "admin", environmentId: row.environmentId, environment: envName as (typeof ENV_NAMES)[number], projectId })
  await next()
})

/**
 * Resolves the bearer token to a key, and checks that it belongs to the project in the URL.
 * The key decides the environment, so one project can never read another environment's data
 * with the wrong key.
 */
export const requireKey = (kinds: ("delivery" | "admin")[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const header = c.req.header("authorization") ?? ""
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
    if (!token) throw new ApiError(401, "missing_key", "Send your key as `Authorization: Bearer <key>`.")

    const [row] = await c
      .get("db")
      .select({
        id: schema.apiKeys.id,
        kind: schema.apiKeys.kind,
        environmentId: schema.apiKeys.environmentId,
        environment: schema.environments.name,
        projectId: schema.environments.projectId,
      })
      .from(schema.apiKeys)
      .innerJoin(schema.environments, eq(schema.environments.id, schema.apiKeys.environmentId))
      .where(and(eq(schema.apiKeys.hash, hashKey(token)), isNull(schema.apiKeys.revokedAt)))
      .limit(1)

    if (!row) throw new ApiError(401, "invalid_key", "That key is not valid or has been revoked.")
    if (!kinds.includes(row.kind)) {
      throw new ApiError(403, "wrong_key_type", `This endpoint needs a ${kinds.join(" or ")} key.`)
    }
    const projectId = c.req.param("projectId")
    if (projectId && projectId !== row.projectId) {
      throw new ApiError(403, "wrong_project", "This key cannot access that project.")
    }
    c.set("key", row)
    await next()
  })
