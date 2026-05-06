export const FORM_STORAGE_KEY = "dify-ev-user-input-form"
export const CHAT_STORAGE_KEY = "dify-ev-chat-session"

export type FormValues = Record<string, unknown>
export type IdentityInfo = { studentName: string; studentId: string }
export type ChatSessionRecord = {
  formValues?: FormValues
  identity?: Partial<IdentityInfo>
  updatedAt?: number
}

const STUDENT_NAME_HINTS = ["name", "student_name", "real_name", "username", "\u59d3\u540d", "\u540d\u5b57"]
const STUDENT_ID_HINTS = ["student_id", "studentid", "stu_id", "sid", "\u5b66\u53f7"]

const NORMALIZED_NAME_KEYS = [
  "name",
  "student_name",
  "real_name",
  "username",
  "studentName",
  "\u59d3\u540d",
] as const

const NORMALIZED_STUDENT_ID_KEYS = [
  "student_id",
  "studentId",
  "student_no",
  "studentid",
  "stu_id",
  "sid",
  "\u5b66\u53f7",
] as const

function normalizeTextValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function includesAnyHint(key: string, hints: readonly string[]) {
  const normalized = key.trim().toLowerCase()
  return hints.some((hint) => normalized.includes(hint.toLowerCase()))
}

function readStoredJson<T>(storageKey: string): T | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as T
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

function writeStoredJson(storageKey: string, value: unknown) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

function buildNormalizedIdentityValues(identity: IdentityInfo) {
  const normalizedName = identity.studentName.trim()
  const normalizedStudentId = identity.studentId.trim()

  return {
    ...Object.fromEntries(NORMALIZED_NAME_KEYS.map((key) => [key, normalizedName])),
    ...Object.fromEntries(NORMALIZED_STUDENT_ID_KEYS.map((key) => [key, normalizedStudentId])),
  }
}

export function isStudentNameKey(key: string) {
  return includesAnyHint(key, STUDENT_NAME_HINTS)
}

export function isStudentIdKey(key: string) {
  return includesAnyHint(key, STUDENT_ID_HINTS)
}

export function extractIdentity(values: FormValues): IdentityInfo {
  let studentName = ""
  let studentId = ""

  Object.entries(values).forEach(([key, value]) => {
    const text = normalizeTextValue(value)
    if (!text) return

    if (!studentName && isStudentNameKey(key)) {
      studentName = text
    }

    if (!studentId && isStudentIdKey(key)) {
      studentId = text
    }
  })

  return { studentName, studentId }
}

export function hasRequiredIdentity(payload: unknown) {
  if (!payload || typeof payload !== "object") return false

  const record = payload as ChatSessionRecord
  const fromIdentity = record.identity
  if (fromIdentity?.studentName?.trim() && fromIdentity?.studentId?.trim()) {
    return true
  }

  const values = record.formValues
  if (!values || typeof values !== "object") return false

  const identity = extractIdentity(values)
  return Boolean(identity.studentName && identity.studentId)
}

export function buildChatSessionPayload(values: FormValues, identity: IdentityInfo): ChatSessionRecord {
  const normalizedName = identity.studentName.trim()
  const normalizedStudentId = identity.studentId.trim()

  return {
    formValues: {
      ...values,
      ...buildNormalizedIdentityValues(identity),
    },
    identity: {
      studentName: normalizedName,
      studentId: normalizedStudentId,
    },
    updatedAt: Date.now(),
  }
}

export function getStoredChatSession(): ChatSessionRecord | null {
  return readStoredJson<ChatSessionRecord>(CHAT_STORAGE_KEY)
}

export function getStoredInputs(): FormValues {
  const session = getStoredChatSession()
  if (session?.formValues && typeof session.formValues === "object") {
    return session.formValues
  }

  return readStoredJson<FormValues>(FORM_STORAGE_KEY) ?? {}
}

export function persistChatSession(values: FormValues, identity: IdentityInfo) {
  const payload = buildChatSessionPayload(values, identity)
  writeStoredJson(FORM_STORAGE_KEY, payload.formValues)
  writeStoredJson(CHAT_STORAGE_KEY, payload)
  return payload
}
