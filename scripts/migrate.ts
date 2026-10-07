/** Applies SQL migrations from ./drizzle to the database in DATABASE_URL (or .env.local). */
try {
  process.loadEnvFile(".env.local")
} catch {}

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("Set DATABASE_URL to the Postgres database you want to migrate.")
  process.exit(1)
}

const client = postgres(url, { max: 1 })
migrate(drizzle(client), { migrationsFolder: "drizzle" })
  .then(() => {
    console.log("Migrations applied.")
    return client.end()
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
