import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import type { Context } from "hono"
import { zValidator } from "@hono/zod-validator"
import type { ZodType } from "zod"
import type { Db } from "./db"
import type { Field } from "./db/schema"

/* ------------------------------------------------------------------ */
/* Hono context                                                        */
/* ------------------------------------------------------------------ */

export type AuthedKey = {
  id: string
  kind: "delivery" | "admin"
  environmentId: string
  environment: "development" | "staging" | "production"
  projectId: string
}

export type AppEnv = {
  Variables: { db: Db; key: AuthedKey; userId?: string }
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 503,
    public code: string,
    message: string,
    public issues?: unknown,
  ) {
    super(message)
  }
}

export const errorBody = (code: string, message: string, issues?: unknown) => ({
  error: { code, message, ...(issues ? { issues } : {}) },
})

/** zValidator that reports failures in the API's standard error shape. */
export const validate = <T extends ZodType, Target extends "json" | "query">(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(errorBody("invalid_request", "The request did not match the expected shape.", result.error.issues), 400)
    }
  })

/* ------------------------------------------------------------------ */
/* Ids and keys                                                        */
/* ------------------------------------------------------------------ */

export const newId = (prefix: string) => `${prefix}_${randomBytes(6).toString("hex")}`

const envShort = { development: "dev", staging: "stg", production: "prod" } as const
const kindShort = { delivery: "pub", admin: "adm" } as const

export function generateKey(env: keyof typeof envShort, kind: keyof typeof kindShort) {
  const raw = `unit_${envShort[env]}_${kindShort[kind]}_${randomBytes(18).toString("base64url")}`
  return { raw, prefix: raw.slice(0, 14), hash: hashKey(raw) }
}

export const hashKey = (raw: string) => createHash("sha256").update(raw).digest("hex")

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/* ------------------------------------------------------------------ */
/* Entry validation against a content type                             */
/* ------------------------------------------------------------------ */

const isPlainObject = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v)

const checks: Record<Field["type"], (v: unknown) => boolean> = {
  text: (v) => typeof v === "string",
  longText: (v) => typeof v === "string",
  richText: (v) => typeof v === "string" || isPlainObject(v) || Array.isArray(v),
  number: (v) => typeof v === "number" && Number.isFinite(v),
  boolean: (v) => typeof v === "boolean",
  date: (v) => typeof v === "string" && !Number.isNaN(Date.parse(v)),
  image: (v) => typeof v === "string", // media id
  file: (v) => typeof v === "string", // media id
  reference: (v) => typeof v === "string", // entry id
  list: (v) => Array.isArray(v),
  object: isPlainObject,
}

/** Returns a list of problems. Required fields are only enforced when `enforceRequired` is set (publishing). */
export function checkEntryData(fields: Field[], data: Record<string, unknown>, enforceRequired: boolean) {
  const problems: { field: string; message: string }[] = []
  const byName = new Map(fields.map((f) => [f.name, f]))

  for (const key of Object.keys(data)) {
    if (!byName.has(key)) problems.push({ field: key, message: "Unknown field" })
  }
  for (const f of fields) {
    const v = data[f.name]
    if (v === undefined || v === null) {
      if (enforceRequired && f.required) problems.push({ field: f.name, message: "Required to publish" })
      continue
    }
    if (!checks[f.type](v)) problems.push({ field: f.name, message: `Expected ${f.type}` })
  }
  return problems
}

export function checkConfigValue(type: "string" | "number" | "boolean" | "json", value: unknown) {
  switch (type) {
    case "string":
      return typeof value === "string"
    case "number":
      return typeof value === "number" && Number.isFinite(value)
    case "boolean":
      return typeof value === "boolean"
    case "json":
      return value !== undefined
  }
}

export const getDb = (c: Context<AppEnv>) => c.get("db")
