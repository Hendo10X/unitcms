import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { and, eq, gt } from "drizzle-orm"
import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { schema, type Db } from "./db"
import { hashKey, newId, type AppEnv } from "./lib"

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export const SESSION_COOKIE = "unit_session"
const SESSION_DAYS = 30

/* Passwords ----------------------------------------------------------- */

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, salt, hash] = stored.split("$")
  if (alg !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "base64")
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/* Sessions ------------------------------------------------------------ */

export async function createSession(c: Context<AppEnv>, userId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await c.get("db").insert(schema.sessions).values({ id: hashKey(token), userId, expiresAt })
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function destroySession(c: Context<AppEnv>) {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await c.get("db").delete(schema.sessions).where(eq(schema.sessions.id, hashKey(token)))
  deleteCookie(c, SESSION_COOKIE, { path: "/" })
}

export type SessionUser = { id: string; email: string; name: string }

export async function getSessionUser(c: Context<AppEnv>): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const [row] = await c
    .get("db")
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hashKey(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)
  return row ?? null
}

export const newUserId = () => newId("user")

/* Throttle for sign-in attempts (per process; good enough to slow guessing) */

const attempts = new Map<string, { n: number; reset: number }>()
export function throttled(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now()
  const a = attempts.get(key)
  if (!a || a.reset < now) {
    attempts.set(key, { n: 1, reset: now + windowMs })
    return false
  }
  a.n += 1
  return a.n > limit
}

export type { Db }
