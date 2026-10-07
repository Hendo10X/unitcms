// Integration test: runs the real Hono app against an in-memory Postgres (PGlite).
process.env.PGLITE_DIR = "memory://"
process.env.UNITCMS_MASTER_KEY = "master_test_key"

import assert from "node:assert/strict"
import { before, describe, it } from "node:test"
import type { app as App } from "./app"

let app: typeof App
let pid: string
let delivery: string
let adminKey: string
let stagingDelivery: string

const call = (path: string, init: RequestInit & { key?: string; json?: unknown } = {}) => {
  const headers = new Headers(init.headers)
  if (init.key) headers.set("authorization", `Bearer ${init.key}`)
  if (init.json !== undefined) headers.set("content-type", "application/json")
  return app.request(`/api/v1${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })
}

describe("UnitCMS API", () => {
  before(async () => {
    ;({ app } = await import("./app"))
  })

  it("creates a project only with the master key", async () => {
    assert.equal((await call("/projects", { method: "POST", json: { name: "Shop" } })).status, 401)
    assert.equal((await call("/projects", { method: "POST", key: "nope", json: { name: "Shop" } })).status, 401)

    const res = await call("/projects", { method: "POST", key: "master_test_key", json: { name: "Shop" } })
    assert.equal(res.status, 201)
    const { data } = await res.json()
    pid = data.project.id
    const prod = data.environments.find((e: { name: string }) => e.name === "production")
    const stg = data.environments.find((e: { name: string }) => e.name === "staging")
    delivery = prod.keys.delivery
    adminKey = prod.keys.admin
    stagingDelivery = stg.keys.delivery
    assert.match(delivery, /^unit_prod_pub_/)
    assert.match(adminKey, /^unit_prod_adm_/)
  })

  it("rejects delivery keys on admin routes and admin keys for other projects", async () => {
    assert.equal((await call(`/projects/${pid}/admin/types`, { key: delivery })).status, 403)
    assert.equal((await call(`/projects/proj_other/content/articles`, { key: delivery })).status, 403)
    assert.equal((await call(`/projects/${pid}/content/articles`)).status, 401)
  })

  it("manages content types and validates entries", async () => {
    const t = await call(`/projects/${pid}/admin/types`, {
      method: "POST",
      key: adminKey,
      json: {
        name: "articles",
        label: "Article",
        fields: [
          { name: "title", type: "text", required: true },
          { name: "views", type: "number" },
        ],
      },
    })
    assert.equal(t.status, 201)
    assert.equal(
      (await call(`/projects/${pid}/admin/types`, { method: "POST", key: adminKey, json: { name: "articles", label: "x" } })).status,
      409,
    )

    const bad = await call(`/projects/${pid}/admin/entries`, {
      method: "POST",
      key: adminKey,
      json: { type: "articles", data: { title: 5, nope: true } },
    })
    assert.equal(bad.status, 422)

    // Drafts may be incomplete, but publishing enforces required fields.
    const draft = await call(`/projects/${pid}/admin/entries`, { method: "POST", key: adminKey, json: { type: "articles", data: { views: 1 } } })
    assert.equal(draft.status, 201)
    const { data: d } = await draft.json()
    assert.equal((await call(`/projects/${pid}/admin/entries/${d.id}/publish`, { method: "POST", key: adminKey })).status, 422)
  })

  it("only delivers published entries, with ETag revalidation", async () => {
    const created = await call(`/projects/${pid}/admin/entries`, {
      method: "POST",
      key: adminKey,
      json: { type: "articles", data: { title: "Welcome to UnitCMS" } },
    })
    const { data: entry } = await created.json()

    let list = await (await call(`/projects/${pid}/content/articles`, { key: delivery })).json()
    assert.equal(list.meta.count, 0)
    assert.equal((await call(`/projects/${pid}/content/articles/${entry.id}`, { key: delivery })).status, 404)

    assert.equal((await call(`/projects/${pid}/admin/entries/${entry.id}/publish`, { method: "POST", key: adminKey })).status, 200)

    const res = await call(`/projects/${pid}/content/articles`, { key: delivery })
    list = await res.json()
    assert.equal(list.meta.count, 1)
    assert.equal(list.data[0].attributes.title, "Welcome to UnitCMS")
    assert.match(res.headers.get("cache-control") ?? "", /stale-while-revalidate/)

    const etag = res.headers.get("etag")
    assert.ok(etag)
    const again = await call(`/projects/${pid}/content/articles`, { key: delivery, headers: { "if-none-match": etag! } })
    assert.equal(again.status, 304)

    await call(`/projects/${pid}/admin/entries/${entry.id}/unpublish`, { method: "POST", key: adminKey })
    list = await (await call(`/projects/${pid}/content/articles`, { key: delivery })).json()
    assert.equal(list.meta.count, 0)
  })

  it("isolates environments", async () => {
    await call(`/projects/${pid}/admin/flags/new_checkout`, { method: "PUT", key: adminKey, json: { enabled: true } })
    const prod = await (await call(`/projects/${pid}/flags`, { key: delivery })).json()
    const stg = await (await call(`/projects/${pid}/flags`, { key: stagingDelivery })).json()
    assert.deepEqual(prod.data, { new_checkout: true })
    assert.deepEqual(stg.data, {})
  })

  it("serves typed config", async () => {
    const put = (key: string, type: string, value: unknown) =>
      call(`/projects/${pid}/admin/config/${key}`, { method: "PUT", key: adminKey, json: { type, value } })
    assert.equal((await put("delivery_fee", "number", 1500)).status, 200)
    assert.equal((await put("maintenance_mode", "boolean", false)).status, 200)
    assert.equal((await put("home_layout", "json", { columns: 2 })).status, 200)
    assert.equal((await put("delivery_fee", "number", "oops")).status, 422)

    const cfg = await (await call(`/projects/${pid}/config`, { key: delivery })).json()
    assert.deepEqual(cfg.data, { delivery_fee: 1500, maintenance_mode: false, home_layout: { columns: 2 } })
  })

  it("issues and revokes keys", async () => {
    const res = await call(`/projects/${pid}/admin/keys`, { method: "POST", key: adminKey, json: { kind: "delivery", label: "iOS" } })
    assert.equal(res.status, 201)
    const { data } = await res.json()
    assert.equal((await call(`/projects/${pid}/flags`, { key: data.key })).status, 200)

    assert.equal((await call(`/projects/${pid}/admin/keys/${data.id}`, { method: "DELETE", key: adminKey })).status, 204)
    assert.equal((await call(`/projects/${pid}/flags`, { key: data.key })).status, 401)

    const listed = await (await call(`/projects/${pid}/admin/keys`, { key: adminKey })).json()
    assert.ok(listed.data.every((k: Record<string, unknown>) => !("hash" in k) && !("key" in k)))
  })

  describe("accounts and the dashboard session", () => {
    let cookie = ""
    let other = ""
    let projectId = ""

    const signup = async (email: string) => {
      const res = await call("/auth/signup", { method: "POST", json: { email, password: "correct horse", name: "Tester" } })
      assert.equal(res.status, 201)
      return (res.headers.get("set-cookie") ?? "").split(";")[0]
    }
    const as = (c: string, extra: Record<string, string> = {}) => ({ headers: { cookie: c, ...extra } })

    it("signs up, signs in and out", async () => {
      cookie = await signup("Ada@Example.com")
      assert.match(cookie, /^unit_session=/)
      assert.equal((await call("/auth/signup", { method: "POST", json: { email: "ada@example.com", password: "correct horse" } })).status, 409)
      assert.equal((await call("/auth/signup", { method: "POST", json: { email: "x@example.com", password: "short" } })).status, 400)

      const me = await (await call("/auth/me", as(cookie))).json()
      assert.equal(me.data.email, "ada@example.com")
      assert.equal((await call("/auth/me")).status, 401)

      assert.equal((await call("/auth/login", { method: "POST", json: { email: "ada@example.com", password: "wrong password" } })).status, 401)
      const login = await call("/auth/login", { method: "POST", json: { email: "ada@example.com", password: "correct horse" } })
      assert.equal(login.status, 200)
      const second = (login.headers.get("set-cookie") ?? "").split(";")[0]

      assert.equal((await call("/auth/logout", { method: "POST", ...as(second) })).status, 204)
      assert.equal((await call("/auth/me", as(second))).status, 401)
    })

    it("resets a forgotten password with a one-time link", async () => {
      // Without RESEND_API_KEY the mail layer logs the message, which is how we read the link here.
      const logged: string[] = []
      const warn = console.warn
      console.warn = (...a: unknown[]) => void logged.push(a.join(" "))
      try {
        // Unknown emails get the same answer.
        assert.equal((await call("/auth/forgot", { method: "POST", json: { email: "nobody@example.com" } })).status, 200)
        assert.equal(logged.length, 0)

        assert.equal((await call("/auth/forgot", { method: "POST", json: { email: "ada@example.com" } })).status, 200)
      } finally {
        console.warn = warn
      }
      const token = logged.join("\n").match(/reset-password\?token=([\w-]+)/)?.[1]
      assert.ok(token, "reset link was logged")

      assert.equal((await call("/auth/reset", { method: "POST", json: { token: "x".repeat(30), password: "brand new pass" } })).status, 400)
      assert.equal((await call("/auth/reset", { method: "POST", json: { token, password: "short" } })).status, 400)
      assert.equal((await call("/auth/reset", { method: "POST", json: { token, password: "brand new pass" } })).status, 200)
      // The link works once, and the old password and session are gone.
      assert.equal((await call("/auth/reset", { method: "POST", json: { token, password: "another pass 1" } })).status, 400)
      assert.equal((await call("/auth/me", as(cookie))).status, 401)
      assert.equal((await call("/auth/login", { method: "POST", json: { email: "ada@example.com", password: "correct horse" } })).status, 401)
      const login = await call("/auth/login", { method: "POST", json: { email: "ada@example.com", password: "brand new pass" } })
      assert.equal(login.status, 200)
      cookie = (login.headers.get("set-cookie") ?? "").split(";")[0]
    })

    it("rejects cross-site writes that rely on the cookie", async () => {
      const res = await call("/auth/logout", { method: "POST", headers: { cookie, origin: "https://evil.example", host: "app.example" } })
      assert.equal(res.status, 403)
      const ok = await call("/auth/forgot", { method: "POST", json: { email: "nobody@example.com" }, headers: { cookie, origin: "https://app.example", host: "app.example" } })
      assert.equal(ok.status, 200)
    })

    it("creates a project with example content and manages it through the session", async () => {
      assert.equal((await call("/projects", { method: "POST", json: { name: "Nope" } })).status, 401)

      const res = await call("/projects", { method: "POST", ...as(cookie), json: { name: "Mine", example: true } })
      assert.equal(res.status, 201)
      const { data } = await res.json()
      projectId = data.project.id
      const prod = data.environments.find((e: { name: string }) => e.name === "production")
      assert.ok(prod.keys.delivery && !prod.keys.admin)

      const list = await (await call("/projects", as(cookie))).json()
      assert.deepEqual(list.data.map((p: { id: string }) => p.id), [projectId])

      // Session reads and writes the management API for the chosen environment.
      const entries = await (await call(`/projects/${projectId}/admin/entries?type=articles`, as(cookie, { "x-unit-env": "production" }))).json()
      assert.equal(entries.meta.total, 2)
      const mk = await call(`/projects/${projectId}/admin/flags/beta`, {
        method: "PUT",
        ...as(cookie, { "x-unit-env": "staging" }),
        json: { enabled: true },
      })
      assert.equal(mk.status, 200)

      // The delivery key sees published content and the example config, and usage is counted.
      const content = await (await call(`/projects/${projectId}/content/articles`, { key: prod.keys.delivery })).json()
      assert.equal(content.meta.count, 1)
      const overview = await (await call(`/projects/${projectId}/admin/overview`, as(cookie))).json()
      assert.equal(overview.data.entries.published, 2)
      assert.equal(overview.data.requests.total, 1)
      assert.equal(overview.data.flags.total, 2)
    })

    it("keeps other people out", async () => {
      other = await signup("grace@example.com")
      assert.equal((await call(`/projects/${projectId}/admin/entries`, as(other))).status, 404)
      assert.equal((await call(`/projects/${projectId}`, { method: "DELETE", ...as(other) })).status, 404)
      assert.deepEqual((await (await call("/projects", as(other))).json()).data, [])
    })

    it("uploads and serves a file, then deletes the project", async () => {
      const form = new FormData()
      form.set("file", new File([new Uint8Array([1, 2, 3, 4])], "dot.png", { type: "image/png" }))
      form.set("width", "1")
      form.set("height", "1")
      const up = await app.request(`/api/v1/projects/${projectId}/admin/media/upload`, { method: "POST", body: form, headers: { cookie } })
      assert.equal(up.status, 201)
      const { data } = await up.json()
      assert.ok(!("data" in data))
      assert.match(data.url, /\/v1\/files\/media_/)

      const file = await app.request(new URL(data.url).pathname.replace("/v1", "/api/v1"))
      assert.equal(file.status, 200)
      assert.equal(file.headers.get("content-type"), "image/png")
      assert.deepEqual([...new Uint8Array(await file.arrayBuffer())], [1, 2, 3, 4])

      assert.equal((await call(`/projects/${projectId}`, { method: "DELETE", ...as(cookie) })).status, 204)
      assert.equal((await call("/projects", as(cookie))).status, 200)
      assert.deepEqual((await (await call("/projects", as(cookie))).json()).data, [])
    })
  })
})
