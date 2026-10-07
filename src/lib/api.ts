export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues?: { field?: string; message: string }[],
  ) {
    super(message)
  }
}

export type RequestOptions = {
  method?: string
  json?: unknown
  form?: FormData
  env?: string
}

/** Same-origin call to the UnitCMS API. Cookies carry the session. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.json !== undefined) headers["content-type"] = "application/json"
  if (opts.env) headers["x-unit-env"] = opts.env

  let res: Response
  try {
    res = await fetch(`/v1${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.form ?? (opts.json !== undefined ? JSON.stringify(opts.json) : undefined),
      credentials: "same-origin",
    })
  } catch {
    throw new ApiRequestError(0, "network", "Could not reach the server. Check your connection.")
  }

  if (res.status === 204) return null as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const e = body?.error
    throw new ApiRequestError(res.status, e?.code ?? "error", e?.message ?? "Something went wrong.", e?.issues)
  }
  return body as T
}

/** A readable one-liner for toasts, including field problems from validation errors. */
export function errorMessage(e: unknown) {
  if (e instanceof ApiRequestError) {
    const detail = e.issues?.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join(", ")
    return detail ? `${e.message} ${detail}` : e.message
  }
  return e instanceof Error ? e.message : "Something went wrong."
}
