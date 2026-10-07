import { app } from "@/server/app"

// The public API is documented at /v1/...; the Hono app itself is mounted under /api.
const handler = (req: Request) => {
  const url = new URL(req.url)
  url.pathname = `/api${url.pathname}`
  return app.fetch(new Request(url, req))
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
