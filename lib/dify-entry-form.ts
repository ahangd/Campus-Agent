import { FORM_STORAGE_KEY, isStudentIdKey, isStudentNameKey, type FormValues } from "@/lib/chat-session"
import type { DifyFormField, DifyFormFieldConfig, DifyFormOption, DifyLocalizedText } from "@/lib/dify"

export type NormalizedField = {
  type: string
  config: DifyFormFieldConfig
}

export type VisibleField = {
  field: NormalizedField
  key: string
}

export function getText(text: DifyLocalizedText, fallback: string) {
  if (typeof text === "string") return text
  if (!text || typeof text !== "object") return fallback
  return text.zh_Hans || text.zh_CN || text.en_US || fallback
}

export function normalizeField(field: DifyFormField): NormalizedField | null {
  const entries = Object.entries(field)
  if (!entries.length) return null

  const [type, rawConfig] = entries[0]
  if (!rawConfig || typeof rawConfig !== "object") return null

  return { type, config: rawConfig as DifyFormFieldConfig }
}

export function getFieldKey(field: NormalizedField, index: number) {
  return typeof field.config.variable === "string" && field.config.variable.trim()
    ? field.config.variable.trim()
    : `field_${index}`
}

export function getDefaultValue(field: NormalizedField) {
  if (field.config.default !== undefined) return field.config.default
  if (field.type === "checkbox" || field.type === "switch") return false
  return ""
}

export function normalizeOptions(options: DifyFormOption[] | undefined) {
  return (options || []).map((option, index) => ({
    label: getText(option?.label, `\u9009\u9879 ${index + 1}`),
    value: option?.value ?? String(index),
  }))
}

export function getStoredFormValues() {
  if (typeof window === "undefined") return {}

  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as FormValues
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function getInitialValues(fields: NormalizedField[]) {
  const stored = getStoredFormValues()
  return fields.reduce<FormValues>((acc, field, index) => {
    const key = getFieldKey(field, index)
    acc[key] = stored[key] ?? getDefaultValue(field)
    return acc
  }, {})
}

export function getStringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function isIdentityField(field: NormalizedField, index: number, kind: "name" | "studentId") {
  const key = getFieldKey(field, index)
  const label = getText(field.config.label, "")
  const placeholder = getText(field.config.placeholder, "")
  const matcher = kind === "name" ? isStudentNameKey : isStudentIdKey

  return [key, label, placeholder].some((candidate) => candidate && matcher(candidate))
}

export function validateField(field: NormalizedField, value: unknown) {
  if (!field.config.required) return null

  if (field.type === "checkbox" || field.type === "switch") {
    return value === true ? null : "\u8be5\u9879\u4e3a\u5fc5\u586b\uff0c\u8bf7\u5148\u52fe\u9009\u3002"
  }

  if (field.type === "number") {
    return value === "" || value === null || value === undefined ? "\u8be5\u9879\u4e3a\u5fc5\u586b\uff0c\u8bf7\u5148\u586b\u5199\u3002" : null
  }

  if (field.type === "json") {
    if (typeof value !== "string" || !value.trim()) return "\u8be5\u9879\u4e3a\u5fc5\u586b\uff0c\u8bf7\u5148\u586b\u5199\u3002"
    try {
      JSON.parse(value)
      return null
    } catch {
      return "JSON \u683c\u5f0f\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u91cd\u8bd5\u3002"
    }
  }

  return typeof value === "string" && value.trim() ? null : "\u8be5\u9879\u4e3a\u5fc5\u586b\uff0c\u8bf7\u5148\u586b\u5199\u3002"
}

export function buildIdentityFieldKeys(fields: NormalizedField[]) {
  const nameKeys: string[] = []
  const idKeys: string[] = []

  fields.forEach((field, index) => {
    const key = getFieldKey(field, index)
    if (isIdentityField(field, index, "name")) nameKeys.push(key)
    if (isIdentityField(field, index, "studentId")) idKeys.push(key)
  })

  return { nameKeys, idKeys }
}

export function buildVisibleFields(fields: NormalizedField[]) {
  return fields.reduce<VisibleField[]>((acc, field, index) => {
    if (!isIdentityField(field, index, "name") && !isIdentityField(field, index, "studentId")) {
      acc.push({ field, key: getFieldKey(field, index) })
    }
    return acc
  }, [])
}
