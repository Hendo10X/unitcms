export type Env = "development" | "staging" | "production"

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
export type ContentType = { id: string; name: string; label: string; fields: Field[] }

export type Entry = {
  id: string
  type: string
  attributes: Record<string, unknown>
  meta: { status: "draft" | "published"; createdAt: string; updatedAt: string; publishedAt: string | null }
}

export type ConfigType = "string" | "number" | "boolean" | "json"
export type ConfigItem = { key: string; type: ConfigType; value: unknown; updatedAt: string }
export type Flag = { key: string; description: string; enabled: boolean; updatedAt: string }

export type MediaItem = {
  id: string
  filename: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  url: string
  createdAt: string
}

export type ApiKey = {
  id: string
  kind: "delivery" | "admin"
  label: string
  prefix: string
  createdAt: string
  revokedAt: string | null
}

export type Overview = {
  types: number
  entries: { total: number; published: number }
  flags: { total: number; enabled: number }
  config: number
  media: number
  requests: { total: number; series: { t: string; count: number }[] }
}

export type Project = { id: string; name: string; createdAt: string }
export type User = { id: string; email: string; name: string }

export const titleOf = (e: Entry) => {
  const a = e.attributes
  const v = a.title ?? a.name ?? a.slug ?? Object.values(a).find((x) => typeof x === "string")
  return typeof v === "string" && v ? v : e.id
}

export const formatBytes = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}
