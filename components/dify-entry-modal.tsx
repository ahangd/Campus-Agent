"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DifyFormField, DifyFormFieldConfig, DifyFormOption, DifyLocalizedText, DifyParametersResponse } from "@/lib/dify"

const FORM_STORAGE_KEY = "dify-ev-user-input-form"
const CHAT_STORAGE_KEY = "dify-ev-chat-session"

type NormalizedField = {
  type: string
  config: DifyFormFieldConfig
}

type FormValues = Record<string, unknown>

function getText(text: DifyLocalizedText, fallback: string) {
  if (typeof text === "string") return text
  if (!text || typeof text !== "object") return fallback
  return text.zh_Hans || text.zh_CN || text.en_US || fallback
}

function normalizeField(field: DifyFormField): NormalizedField | null {
  const entries = Object.entries(field)
  if (!entries.length) return null
  const [type, rawConfig] = entries[0]
  if (!rawConfig || typeof rawConfig !== "object") return null
  return { type, config: rawConfig as DifyFormFieldConfig }
}

function getFieldKey(field: NormalizedField, index: number) {
  return typeof field.config.variable === "string" && field.config.variable.trim()
    ? field.config.variable.trim()
    : `field_${index}`
}

function getDefaultValue(field: NormalizedField) {
  if (field.config.default !== undefined) return field.config.default
  if (field.type === "checkbox" || field.type === "switch") return false
  return ""
}

function normalizeOptions(options: DifyFormOption[] | undefined) {
  return (options || []).map((option, index) => ({
    label: getText(option?.label, `选项 ${index + 1}`),
    value: option?.value ?? String(index),
  }))
}

function getStoredFormValues() {
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

function getInitialValues(fields: NormalizedField[]) {
  const stored = getStoredFormValues()
  return fields.reduce<FormValues>((acc, field, index) => {
    const key = getFieldKey(field, index)
    acc[key] = stored[key] ?? getDefaultValue(field)
    return acc
  }, {})
}

function validateField(field: NormalizedField, value: unknown) {
  if (!field.config.required) return null

  if (field.type === "checkbox" || field.type === "switch") {
    return value === true ? null : "该项为必填，请先勾选"
  }

  if (field.type === "number") {
    return value === "" || value === null || value === undefined ? "该项为必填，请先填写" : null
  }

  if (field.type === "json") {
    if (typeof value !== "string" || !value.trim()) return "该项为必填，请先填写"
    try {
      JSON.parse(value)
      return null
    } catch {
      return "JSON 格式不正确，请检查后重试"
    }
  }

  return typeof value === "string" && value.trim() ? null : "该项为必填，请先填写"
}

function getDisplayError(field: NormalizedField, value: unknown, submitted: boolean) {
  if (!submitted) return null
  return validateField(field, value)
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

export default function DifyEntryModal() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formFields, setFormFields] = useState<NormalizedField[]>([])
  const [values, setValues] = useState<FormValues>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false

    // 第一次渲染时向后端取 Dify 的动态表单定义（不是写死字段）。
    const loadParameters = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/dify/parameters", { cache: "no-store" })
        if (!res.ok) {
          const message = await res.text()
          throw new Error(message || `请求失败 (${res.status})`)
        }

        const data = (await res.json()) as DifyParametersResponse
        const fields = (data.user_input_form || []).map(normalizeField).filter(Boolean) as NormalizedField[]

        if (!cancelled) {
          // values 会优先回填本地草稿，方便刷新后继续填写。
          setFormFields(fields)
          setValues(getInitialValues(fields))
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "表单加载失败")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadParameters()

    return () => {
      cancelled = true
    }
  }, [])

  const requiredFieldCount = useMemo(() => formFields.filter((field) => field.config.required).length, [formFields])

  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      try {
        // 实时保存草稿，给快捷提问和刷新回填使用。
        window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore draft persistence failure and keep typing experience smooth
      }
      return next
    })
    setSubmitError(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)

    // 提交时统一做必填校验（平时输入不打断用户）。
    const errors = formFields
      .map((field, index) => {
        const key = getFieldKey(field, index)
        return validateField(field, values[key])
      })
      .filter(Boolean)

    if (errors.length > 0) {
      setSubmitError("请先完整填写所有必填项后，再开始对话。")
      return
    }

    try {
      // FORM_STORAGE_KEY: 实时草稿；CHAT_STORAGE_KEY: 已提交快照（用于聊天输入参数）。
      window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(values))
      window.localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          formValues: values,
          updatedAt: Date.now(),
        })
      )
    } catch {
      setSubmitError("本地保存失败，请确认浏览器允许本地存储。")
      return
    }

    // 表单通过后进入聊天页，后续由聊天页自动读取 inputs。
    router.push("/chat")
  }

  return (
    <div className="w-full">
      <div className="w-full rounded-[32px] border border-slate-200 bg-white shadow-sm">
        {/* 控件：表单头部。作用：告诉用户当前在填写调研表单，以及必填项数量。 */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">调研表单</div>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">告诉我你的学号和姓名？</h2>
            {requiredFieldCount > 0 ? <p className="mt-2 text-sm leading-6 text-slate-500">当前有 {requiredFieldCount} 个必填项。</p> : null}
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          {/* 控件：加载提示。作用：等待 Dify 返回动态表单字段时给用户反馈。 */}
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载 Dify 表单配置...
            </div>
          ) : null}

          {/* 控件：错误提示框。作用：显示接口失败或表单配置异常信息。 */}
          {!loading && error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {!loading && !error && formFields.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              当前应用未配置 `user_input_form`，暂时无法渲染调研表单。
            </div>
          ) : null}

          {/* 控件：动态字段渲染区。作用：根据 Dify user_input_form 自动生成输入控件。 */}
          {!loading && !error
            ? formFields.map((field, index) => {
                const key = getFieldKey(field, index)
                const label = getText(field.config.label, key)
                const placeholder = getText(field.config.placeholder, `请输入${label}`)
                const helperError = getDisplayError(field, values[key], submitted)
                const options = normalizeOptions(field.config.options)

                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-800">
                      {label}
                      {field.config.required ? <span className="ml-1 text-rose-500">*</span> : null}
                    </label>

                    {(field.type === "text-input" || field.type === "secret-input") && (
                      <input
                        type={field.type === "secret-input" ? "password" : "text"}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder={placeholder}
                        value={getStringValue(values[key])}
                        onChange={(event) => updateValue(key, event.target.value)}
                      />
                    )}

                    {field.type === "paragraph" && (
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder={placeholder}
                        value={getStringValue(values[key])}
                        onChange={(event) => updateValue(key, event.target.value)}
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder={placeholder}
                        value={values[key] === "" || values[key] === undefined ? "" : String(values[key])}
                        onChange={(event) => updateValue(key, event.target.value)}
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        value={typeof values[key] === "string" || typeof values[key] === "number" ? String(values[key]) : ""}
                        onChange={(event) => updateValue(key, event.target.value)}
                      >
                        <option value="">请选择</option>
                        {options.map((option) => (
                          <option key={`${key}-${String(option.value)}`} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "radio" && (
                      <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
                        {options.map((option) => (
                          <label key={`${key}-${String(option.value)}`} className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={key}
                              checked={String(values[key] ?? "") === String(option.value)}
                              onChange={() => updateValue(key, option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(field.type === "checkbox" || field.type === "switch") && (
                      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(values[key])}
                          onChange={(event) => updateValue(key, event.target.checked)}
                        />
                        <span>{placeholder}</span>
                      </label>
                    )}

                    {field.type === "json" && (
                      <textarea
                        className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder={placeholder}
                        value={getStringValue(values[key])}
                        onChange={(event) => updateValue(key, event.target.value)}
                      />
                    )}

                    {!["text-input", "secret-input", "paragraph", "number", "select", "radio", "checkbox", "switch", "json"].includes(
                      field.type
                    ) && (
                      <input
                        type="text"
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder={placeholder}
                        value={getStringValue(values[key])}
                        onChange={(event) => updateValue(key, event.target.value)}
                      />
                    )}

                    {helperError ? <p className="text-sm text-rose-600">{helperError}</p> : null}
                  </div>
                )
              })
            : null}

          {submitError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-5">
          {/* 控件：开始对话按钮。作用：触发表单校验，保存数据并跳转聊天页。 */}
          <Button
            type="button"
            className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800"
            onClick={handleSubmit}
            disabled={loading || !!error || formFields.length === 0}
          >
            开始对话
          </Button>
        </div>
      </div>
    </div>
  )
}
