type JsonRecord = Record<string, unknown>

const RESULT_KEYS = ["data", "rows", "items", "list", "records", "result"] as const
const PRIORITY_FIELDS = [
  "title",
  "name",
  "course_name",
  "teacher",
  "location",
  "time",
  "date",
  "week",
  "status",
  "value",
  "content",
] as const

const MAX_ARRAY_ITEMS = 3
const MAX_OBJECT_FIELDS = 6
const MAX_TEXT_LENGTH = 180

const FIELD_LABELS: Record<string, string> = {
  title: "\u6807\u9898",
  name: "\u540d\u79f0",
  student_name: "\u59d3\u540d",
  real_name: "\u59d3\u540d",
  username: "\u59d3\u540d",
  student_id: "\u5b66\u53f7",
  studentid: "\u5b66\u53f7",
  student_no: "\u5b66\u53f7",
  stu_id: "\u5b66\u53f7",
  sid: "\u5b66\u53f7",
  course_name: "\u8bfe\u7a0b\u540d\u79f0",
  course: "\u8bfe\u7a0b",
  teacher: "\u6388\u8bfe\u6559\u5e08",
  teacher_name: "\u6388\u8bfe\u6559\u5e08",
  instructor: "\u6388\u8bfe\u6559\u5e08",
  location: "\u5730\u70b9",
  classroom: "\u6559\u5ba4",
  room: "\u6559\u5ba4",
  building: "\u697c\u680b",
  campus: "\u6821\u533a",
  time: "\u65f6\u95f4",
  start_time: "\u5f00\u59cb\u65f6\u95f4",
  end_time: "\u7ed3\u675f\u65f6\u95f4",
  date: "\u65e5\u671f",
  day: "\u65e5\u671f",
  week: "\u5468\u6b21",
  weeks: "\u5468\u6b21",
  weekday: "\u661f\u671f",
  day_of_week: "\u661f\u671f",
  status: "\u72b6\u6001",
  value: "\u503c",
  content: "\u5185\u5bb9",
  description: "\u8bf4\u660e",
  source_department: "\u6765\u6e90\u90e8\u95e8",
  sourcedepartment: "\u6765\u6e90\u90e8\u95e8",
  kind: "\u77e5\u8bc6\u7c7b\u578b",
  score: "\u5206\u6570",
  credits: "\u5b66\u5206",
  semester: "\u5b66\u671f",
  college: "\u5b66\u9662",
  category: "\u5206\u7c7b",
  department: "\u9662\u7cfb",
  library: "\u56fe\u4e66\u9986",
  seat: "\u5ea7\u4f4d",
  available: "\u53ef\u7528\u72b6\u6001",
  availability: "\u53ef\u7528\u72b6\u6001",
  count: "\u6570\u91cf",
  total: "\u603b\u6570",
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function tryParseJson(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === "string" && parsed !== trimmed) {
      return tryParseJson(parsed)
    }

    return parsed
  } catch {
    return trimmed
  }
}

function unwrapEnvelope(value: unknown): { toolName?: string; payload: unknown } {
  if (!isRecord(value)) {
    return { payload: value }
  }

  const entries = Object.entries(value)
  if (entries.length !== 1) {
    return { payload: value }
  }

  const [toolName, nested] = entries[0]
  if (typeof nested === "string") {
    return { toolName, payload: tryParseJson(nested) }
  }

  return { toolName, payload: nested }
}

function pickResultPayload(value: unknown): unknown {
  if (!isRecord(value)) return value

  for (const key of RESULT_KEYS) {
    if (key in value) {
      return value[key]
    }
  }

  return value
}

function shortenText(value: string, maxLength = MAX_TEXT_LENGTH) {
  const text = value.replace(/\s+/g, " ").trim()
  if (!text) return ""
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function toChineseLabel(key: string) {
  const normalized = key.trim()
  if (!normalized) return "\u5b57\u6bb5"

  const lowerKey = normalized.toLowerCase()
  if (FIELD_LABELS[lowerKey]) return FIELD_LABELS[lowerKey]

  const snakeCase = normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase()

  if (FIELD_LABELS[snakeCase]) return FIELD_LABELS[snakeCase]

  return normalized.replace(/_/g, " ")
}

function summarizeRecord(record: JsonRecord) {
  const preferredEntries = PRIORITY_FIELDS
    .filter((key) => key in record)
    .map((key) => [key, record[key]] as const)

  const fallbackEntries = Object.entries(record).filter(([key]) => !PRIORITY_FIELDS.includes(key as (typeof PRIORITY_FIELDS)[number]))
  const selected = [...preferredEntries, ...fallbackEntries].slice(0, MAX_OBJECT_FIELDS)

  if (selected.length === 0) {
    return "\u8fd4\u56de\u4e86\u5bf9\u8c61\u7ed3\u679c\uff0c\u4f46\u6ca1\u6709\u53ef\u5c55\u793a\u5b57\u6bb5\u3002"
  }

  const lines = selected
    .map(([key, value]) => {
      const label = toChineseLabel(key)
      if (value === null || value === undefined || value === "") return null
      if (typeof value === "string") return `${label}: ${shortenText(value, 60)}`
      if (typeof value === "number" || typeof value === "boolean") return `${label}: ${String(value)}`
      if (Array.isArray(value)) return `${label}: \u5171 ${value.length} \u9879`
      if (isRecord(value)) return `${label}: ${Object.keys(value).length} \u4e2a\u5b57\u6bb5`
      return `${label}: ${String(value)}`
    })
    .filter((item): item is string => Boolean(item))

  if (lines.length === 0) {
    return "\u8fd4\u56de\u4e86\u5bf9\u8c61\u7ed3\u679c\uff0c\u4f46\u6ca1\u6709\u53ef\u5c55\u793a\u5b57\u6bb5\u3002"
  }

  const remaining = Object.keys(record).length - selected.length
  return `${lines.join("\n")}${remaining > 0 ? `\n\u53e6\u6709 ${remaining} \u4e2a\u5b57\u6bb5\u5df2\u7701\u7565\u3002` : ""}`
}

function summarizeArray(items: unknown[]) {
  if (items.length === 0) {
    return "\u672a\u67e5\u8be2\u5230\u7ed3\u679c\u3002"
  }

  const preview = items.slice(0, MAX_ARRAY_ITEMS).map((item, index) => {
    if (typeof item === "string") {
      return `${index + 1}. ${shortenText(item, 80)}`
    }

    if (isRecord(item)) {
      return `${index + 1}. ${summarizeRecord(item)}`
    }

    return `${index + 1}. ${String(item)}`
  })

  const omitted = items.length - MAX_ARRAY_ITEMS
  return `${preview.join("\n\n")}${omitted > 0 ? `\n\n\u53e6\u6709 ${omitted} \u6761\u7ed3\u679c\u5df2\u7701\u7565\u3002` : ""}`
}

function formatPayload(value: unknown): string {
  if (typeof value === "string") {
    return shortenText(value) || "\u5de5\u5177\u5df2\u6267\u884c\uff0c\u4f46\u6ca1\u6709\u8fd4\u56de\u53ef\u5c55\u793a\u7684\u7ed3\u679c\u3002"
  }

  if (Array.isArray(value)) {
    return summarizeArray(value)
  }

  if (isRecord(value)) {
    return summarizeRecord(value)
  }

  if (value === null || value === undefined) {
    return "\u5de5\u5177\u5df2\u6267\u884c\uff0c\u4f46\u6ca1\u6709\u8fd4\u56de\u53ef\u5c55\u793a\u7684\u7ed3\u679c\u3002"
  }

  return String(value)
}

export function formatObservationBlock(raw: string) {
  const parsed = tryParseJson(raw)
  const { toolName, payload } = unwrapEnvelope(parsed)
  const result = pickResultPayload(payload)
  const formatted = formatPayload(result)

  return {
    toolName,
    result,
    formatted: toolName ? `\u5de5\u5177: ${toolName}\n\u7ed3\u679c:\n${formatted}` : formatted,
  }
}
