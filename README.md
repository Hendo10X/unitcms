# UnitCMS

The content and configuration backend for mobile apps. One Next.js app contains:

- the marketing site (`/`), docs (`/docs`), sign in and sign up (`/login`, `/signup`)
- the dashboard (`/dashboard`), which talks to the real API with a signed-in session
- a Hono REST API (`src/server`) at `/v1/...`
- a Postgres schema managed with Drizzle (`src/server/db/schema.ts`, SQL in `drizzle/`)

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and create a project. Leave "Start with example content" on to get articles, banners, config values and flags to play with.

With no `DATABASE_URL`, the API uses an embedded Postgres (PGlite) stored in `.data/pglite`, so there is nothing else to set up. Delete `.data` to start fresh.

## Use Neon (or any Postgres)

Put your connection string in `.env.local` (git ignores it, never commit it):

```bash
cp .env.example .env.local     # then fill in DATABASE_URL
npm run db:migrate             # creates the tables
npm run dev
```

With `DATABASE_URL` set, the app uses that database. To try things locally without touching it, run with `USE_EMBEDDED_DB=1`.

## Deploy

PGlite writes to disk, so a hosted deployment needs a real Postgres database (Neon, Supabase, Vercel Postgres, etc.).

1. Apply the schema once, and again after any schema change: `npm run db:migrate` (with `DATABASE_URL` pointing at the production database).
2. Set environment variables on your host (see `.env.example`):
   - `DATABASE_URL`: the connection string
   - `APP_URL`: your public URL, for links in emails
   - `RESEND_API_KEY` and `EMAIL_FROM`: so password reset emails are actually sent
   - `UNITCMS_MASTER_KEY`: optional, only for creating projects from scripts
3. Deploy (`npm run build` / `npm start`, or push to Vercel).

Without `RESEND_API_KEY`, reset links are printed to the server log instead of emailed, so password reset won't work for real users until you add it.

Sessions use an `httpOnly`, `SameSite=Lax` cookie that is `Secure` in production, so serve the site over HTTPS.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | API integration tests against in-memory Postgres |
| `npm run db:generate` | Generate a migration after editing `schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Create a demo project with the master key and print its keys |

## How access works

| Who | Credential | Can do |
| --- | --- | --- |
| Mobile app | delivery key (`unit_prod_pub_...`) | Read published content, config and flags for one environment |
| Dashboard | sign-in session cookie | Manage projects you own, in the environment you pick |
| Your server or scripts | admin key (`unit_prod_adm_...`) | Everything in `/v1/projects/:id/admin/...` for one environment |

Keys are stored as SHA-256 hashes and shown once. Passwords are hashed with scrypt. Session tokens are stored hashed. Sign-in attempts are throttled per process.

## API at a glance

```text
POST   /v1/auth/signup | /login | /logout | /forgot | /reset      GET /v1/auth/me
GET    /v1/projects                              POST /v1/projects    DELETE /v1/projects/:id

GET    /v1/projects/:id/content/:type[/:entryId]     (delivery key)
GET    /v1/projects/:id/config | /flags              (delivery key)

/v1/projects/:id/admin/{project,overview,types,entries,config,flags,media,keys}
GET    /v1/files/:mediaId                            (public file bytes)
```

Full reference is in the docs at `/docs/rest-api`.

## Known limits

- Uploaded files are stored in Postgres, capped at 4 MB each. Swap in S3 or R2 for large media.
- Sign-in throttling is in memory, so it is per server instance.
- No email verification yet (password reset by email works once Resend is configured).
- Roles and teams are not built: a project belongs to the one account that created it.
