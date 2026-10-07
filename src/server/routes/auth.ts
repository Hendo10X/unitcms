import { Hono } from "hono"
import { randomBytes } from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"
import { z } from "zod"
import { resetEmail, sendMail } from "../mail"
import { schema } from "../db"
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  newUserId,
  throttled,
  verifyPassword,
} from "../auth"
import { ApiError, hashKey, validate, type AppEnv } from "../lib"

export const auth = new Hono<AppEnv>()

const email = z.string().trim().toLowerCase().email().max(200)

const clientKey = (c: { req: { header: (n: string) => string | undefined } }, extra: string) =>
  `${(c.req.header("x-forwarded-for") ?? "local").split(",")[0].trim()}:${extra}`

auth.post(
  "/signup",
  validate("json", z.object({ email, password: z.string().min(8).max(200), name: z.string().trim().max(80).default("") })),
  async (c) => {
    const body = c.req.valid("json")
    if (throttled(clientKey(c, "signup"), 10)) throw new ApiError(429, "too_many_requests", "Too many attempts. Try again in a minute.")
    const db = c.get("db")
    const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, body.email)).limit(1)
    if (existing) throw new ApiError(409, "email_taken", "An account with that email already exists.")

    const [user] = await db
      .insert(schema.users)
      .values({ id: newUserId(), email: body.email, name: body.name, passwordHash: await hashPassword(body.password) })
      .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
    await createSession(c, user.id)
    return c.json({ data: user }, 201)
  },
)

auth.post("/login", validate("json", z.object({ email, password: z.string().max(200) })), async (c) => {
  const body = c.req.valid("json")
  if (throttled(clientKey(c, body.email))) throw new ApiError(429, "too_many_requests", "Too many attempts. Try again in a minute.")
  const [user] = await c.get("db").select().from(schema.users).where(eq(schema.users.email, body.email)).limit(1)
  // Same message and similar work for unknown email and wrong password.
  const ok = user ? await verifyPassword(body.password, user.passwordHash) : await verifyPassword(body.password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA")
  if (!user || !ok) throw new ApiError(401, "invalid_credentials", "Wrong email or password.")
  await createSession(c, user.id)
  return c.json({ data: { id: user.id, email: user.email, name: user.name } })
})

/** Always answers the same way, so the form can't be used to find out who has an account. */
auth.post("/forgot", validate("json", z.object({ email })), async (c) => {
  const { email: address } = c.req.valid("json")
  if (throttled(clientKey(c, `forgot:${address}`), 3, 15 * 60_000)) {
    throw new ApiError(429, "too_many_requests", "Too many requests. Try again in a few minutes.")
  }
  const db = c.get("db")
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, address)).limit(1)
  if (user) {
    const token = randomBytes(32).toString("base64url")
    await db.insert(schema.passwordResets).values({ id: hashKey(token), userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) })
    const base = (process.env.APP_URL ?? new URL(c.req.url).origin).replace(/\/$/, "")
    const mail = resetEmail(`${base}/reset-password?token=${token}`)
    await sendMail({ to: address, ...mail }).catch((e) => console.error("[mail] failed", e))
  }
  return c.json({ data: { ok: true } })
})

auth.post("/reset", validate("json", z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(200) })), async (c) => {
  const { token, password } = c.req.valid("json")
  if (throttled(clientKey(c, "reset"), 10)) throw new ApiError(429, "too_many_requests", "Too many attempts. Try again in a minute.")
  const db = c.get("db")
  const [row] = await db
    .select()
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.id, hashKey(token)), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date())))
    .limit(1)
  if (!row) throw new ApiError(400, "invalid_token", "This reset link is invalid or has expired. Request a new one.")

  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ passwordHash: await hashPassword(password) }).where(eq(schema.users.id, row.userId))
    await tx.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.id, row.id))
    // Signing out everywhere is the safe default after a reset.
    await tx.delete(schema.sessions).where(eq(schema.sessions.userId, row.userId))
  })
  return c.json({ data: { ok: true } })
})

auth.post("/logout", async (c) => {
  await destroySession(c)
  return c.body(null, 204)
})

auth.get("/me", async (c) => {
  const user = await getSessionUser(c)
  if (!user) throw new ApiError(401, "not_signed_in", "Sign in to continue.")
  return c.json({ data: user })
})
