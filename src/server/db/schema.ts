import {
  customType,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const envName = pgEnum("env_name", ["development", "staging", "production"])
export const keyKind = pgEnum("key_kind", ["delivery", "admin"])
export const entryStatus = pgEnum("entry_status", ["draft", "published"])
export const configType = pgEnum("config_type", ["string", "number", "boolean", "json"])

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()

const bytea = customType<{ data: Buffer; driverData: Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => Buffer.from(v),
  toDriver: (v) => v,
})

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // user_xxx
    email: text("email").notNull(), // stored lowercase
    name: text("name").notNull().default(""),
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email").on(t.email)],
)

/** The session id is the SHA-256 of the cookie token, so a database leak can't be used to sign in. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
})

/** One-time password reset links. Only the hash of the emailed token is stored. */
export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(), // SHA-256 of the token
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
})

export const projects = pgTable("projects", {
  id: text("id").primaryKey(), // proj_xxx
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
})

/** Delivery requests per environment per hour, for the dashboard overview. */
export const usage = pgTable(
  "usage",
  {
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    bucket: timestamp("bucket", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.environmentId, t.bucket] })],
)

export const environments = pgTable(
  "environments",
  {
    id: text("id").primaryKey(), // env_xxx
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: envName("name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("environments_project_name").on(t.projectId, t.name)],
)

/** Keys are stored hashed. The raw key is only ever returned once, at creation. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(), // key_xxx
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    kind: keyKind("kind").notNull(),
    label: text("label").notNull().default(""),
    prefix: text("prefix").notNull(), // first characters, safe to display
    hash: text("hash").notNull(),
    createdAt: createdAt(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("api_keys_hash").on(t.hash)],
)

export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "image"
  | "file"
  | "richText"
  | "reference"
  | "list"
  | "object"

export type Field = { name: string; type: FieldType; required?: boolean }

export const contentTypes = pgTable(
  "content_types",
  {
    id: text("id").primaryKey(), // type_xxx
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // url segment, e.g. "articles"
    label: text("label").notNull(),
    fields: jsonb("fields").$type<Field[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("content_types_project_name").on(t.projectId, t.name)],
)

export const contentEntries = pgTable(
  "content_entries",
  {
    id: text("id").primaryKey(), // e.g. article_xxx
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    typeId: text("type_id")
      .notNull()
      .references(() => contentTypes.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    status: entryStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("content_entries_lookup").on(t.environmentId, t.typeId, t.status)],
)

/** Each edit of an entry is kept so versioning can be added without a migration of history. */
export const contentVersions = pgTable("content_versions", {
  id: text("id").primaryKey(),
  entryId: text("entry_id")
    .notNull()
    .references(() => contentEntries.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: createdAt(),
})

export const media = pgTable("media", {
  id: text("id").primaryKey(), // media_xxx
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  url: text("url").notNull(),
  /** Bytes of files uploaded through the dashboard. Null for files hosted elsewhere. */
  data: bytea("data"),
  createdAt: createdAt(),
})

export const configItems = pgTable(
  "config_items",
  {
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    type: configType("type").notNull(),
    value: jsonb("value").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.environmentId, t.key] })],
)

export const featureFlags = pgTable(
  "feature_flags",
  {
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    description: text("description").notNull().default(""),
    enabled: boolean("enabled").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.environmentId, t.key] })],
)
