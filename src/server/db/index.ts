import { mkdirSync } from "node:fs"
import path from "node:path"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import * as schema from "./schema"

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

const migrationsFolder = path.join(process.cwd(), "drizzle")

let cached: Promise<Db> | undefined

async function connect(): Promise<Db> {
  // USE_EMBEDDED_DB=1 forces the local database even when DATABASE_URL is set (handy for testing).
  const url = process.env.USE_EMBEDDED_DB === "1" ? undefined : process.env.DATABASE_URL
  if (url) {
    // Real Postgres. Run `npm run db:migrate` to apply migrations.
    const [{ drizzle }, { default: postgres }] = await Promise.all([
      import("drizzle-orm/postgres-js"),
      import("postgres"),
    ])
    return drizzle(postgres(url, { max: 10, prepare: false }), { schema }) as unknown as Db
  }

  // No DATABASE_URL: use an embedded Postgres (PGlite) so the API runs with zero setup.
  // Data lives in .data/pglite, or in memory when PGLITE_DIR=memory://.
  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ])
  const dir = process.env.PGLITE_DIR ?? ".data/pglite"
  if (!dir.includes("://")) mkdirSync(path.dirname(dir), { recursive: true })
  const client = new PGlite(dir)
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder })
  return db as unknown as Db
}

export function getDb(): Promise<Db> {
  cached ??= connect()
  return cached
}

export { schema }
