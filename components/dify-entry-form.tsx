"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react"

import DifyEntryFormField from "@/components/dify-entry-form-field"
import { Button } from "@/components/ui/button"
import {
  buildIdentityFieldKeys,
  buildVisibleFields,
  getInitialValues,
  getText,
  normalizeField,
  validateField,
  type NormalizedField,
} from "@/lib/dify-entry-form"
import {
  collectIdentityContext,
  FORM_STORAGE_KEY,
  persistAgentContext as persistChatSession,
  type FormValues,
} from "@/lib/context-manager"
import type { DifyParametersResponse } from "@/lib/dify"

type DifyEntryFormProps = {
  title?: string
  description?: string
  submitLabel?: string
  cardClassName?: string
  onSuccess?: (payload: {
    formValues: FormValues
    identity: { studentName: string; studentId: string }
  }) => void
}

function persistDraftValues(values: FormValues) {
  try {
    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(values))
  } catch {
    // Ignore local persistence failures during typing.
  }
}

function syncIdentityFromValues(nextValues: FormValues, setStudentName: (value: string) => void, setStudentId: (value: string) => void) {
  const identity = collectIdentityContext(nextValues)
  setStudentName(identity.studentName)
  setStudentId(identity.studentId)
}

export default function DifyEntryForm({
  title = "\u5148\u5b8c\u6210\u5fc5\u8981\u4fe1\u606f\u91c7\u96c6\uff0c\u518d\u8fdb\u5165\u5bf9\u8bdd\u5de5\u4f5c\u53f0\u3002",
  description = "\u7528\u6237\u586b\u5199\u7684\u8868\u5355\u5185\u5bb9\u4f1a\u4fdd\u5b58\u5728\u672c\u5730\uff0c\u5e76\u5728\u8fdb\u5165\u5bf9\u8bdd\u540e\u81ea\u52a8\u66ff\u6362\u63d0\u793a\u8bcd\u4e2d\u7684\u53d8\u91cf\u3002\u59d3\u540d\u548c\u5b66\u53f7\u4e3a\u5f00\u59cb\u5bf9\u8bdd\u524d\u7684\u5fc5\u586b\u9879\u3002",
  submitLabel = "\u8fdb\u5165\u804a\u5929\u5de5\u4f5c\u53f0",
  cardClassName,
  onSuccess,
}: DifyEntryFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formFields, setFormFields] = useState<NormalizedField[]>([])
  const [values, setValues] = useState<FormValues>({})
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadParameters = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/dify/parameters", { cache: "no-store" })
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || `\u8bf7\u6c42\u5931\u8d25 (${response.status})`)
        }

        const data = (await response.json()) as DifyParametersResponse
        const fields = (data.user_input_form || []).map(normalizeField).filter(Boolean) as NormalizedField[]

        if (!cancelled) {
          const nextValues = getInitialValues(fields)
          setFormFields(fields)
          setValues(nextValues)
          syncIdentityFromValues(nextValues, setStudentName, setStudentId)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "\u8868\u5355\u52a0\u8f7d\u5931\u8d25\u3002")
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

  const identityFieldKeys = useMemo(() => buildIdentityFieldKeys(formFields), [formFields])
  const visibleFormFields = useMemo(() => buildVisibleFields(formFields), [formFields])
  const requiredFieldCount = useMemo(
    () => visibleFormFields.filter(({ field }) => field.config.required).length,
    [visibleFormFields]
  )

  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      syncIdentityFromValues(next, setStudentName, setStudentId)
      persistDraftValues(next)
      return next
    })
    setSubmitError(null)
  }

  const updateIdentityValue = (kind: "name" | "studentId", nextValue: string) => {
    if (kind === "name") {
      setStudentName(nextValue)
    } else {
      setStudentId(nextValue)
    }

    setValues((prev) => {
      const next = { ...prev }
      const keys = kind === "name" ? identityFieldKeys.nameKeys : identityFieldKeys.idKeys
      keys.forEach((key) => {
        next[key] = nextValue
      })
      persistDraftValues(next)
      return next
    })
    setSubmitError(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)

    const fieldErrors = visibleFormFields
      .map(({ field, key }) => ({ field, key, error: validateField(field, values[key]) }))
      .filter((item) => item.error)

    if (fieldErrors.length > 0) {
      setSubmitError("\u8bf7\u5148\u5b8c\u6574\u586b\u5199\u6240\u6709\u5fc5\u586b\u9879\uff0c\u518d\u5f00\u59cb\u5bf9\u8bdd\u3002")
      return
    }

    const normalizedName = studentName.trim()
    const normalizedStudentId = studentId.trim()

    if (!normalizedName || !normalizedStudentId) {
      setSubmitError("\u5f00\u59cb\u5bf9\u8bdd\u524d\u5fc5\u987b\u586b\u5199\u59d3\u540d\u548c\u5b66\u53f7\u3002")
      return
    }

    try {
      const payload = persistChatSession(values, {
        studentName: normalizedName,
        studentId: normalizedStudentId,
      })

      setSubmitError(null)
      onSuccess?.({
        formValues: payload.formValues || {},
        identity: {
          studentName: normalizedName,
          studentId: normalizedStudentId,
        },
      })
    } catch {
      setSubmitError("\u672c\u5730\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u6d4f\u89c8\u5668\u5141\u8bb8\u672c\u5730\u5b58\u50a8\u3002")
    }
  }

  return (
    <div className={cardClassName || "w-full rounded-[28px] bg-[color:var(--surface)] p-4 sm:p-5"}>
      <div className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(47,107,255,0.04),rgba(47,107,255,0.01))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="section-kicker">{"\u5f00\u59cb\u4f7f\u7528"}</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">{description}</p>
          </div>

          <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2 text-[var(--text)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              {"\u672c\u5730\u4fdd\u5b58"}
            </div>
            <div className="mt-2">
              {requiredFieldCount > 0
                ? `\u5f53\u524d\u5171\u6709 ${requiredFieldCount} \u9879\u989d\u5916\u5fc5\u586b\u4fe1\u606f\u3002`
                : "\u5f53\u524d\u8868\u5355\u6ca1\u6709\u989d\u5916\u5fc5\u586b\u9879\u3002"}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-4 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">
                {"\u59d3\u540d"}
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="h-12 w-full rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                placeholder={"\u8bf7\u8f93\u5165\u59d3\u540d"}
                value={studentName}
                onChange={(event) => updateIdentityValue("name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">
                {"\u5b66\u53f7"}
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="h-12 w-full rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
                placeholder={"\u8bf7\u8f93\u5165\u5b66\u53f7"}
                value={studentId}
                onChange={(event) => updateIdentityValue("studentId", event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-3 rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {"\u6b63\u5728\u52a0\u8f7d Dify \u8868\u5355\u914d\u7f6e..."}
            </div>
          ) : null}

          {!loading && error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {!loading && !error && formFields.length === 0 ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {"\u5f53\u524d\u5e94\u7528\u5c1a\u672a\u914d\u7f6e user_input_form\uff0c\u6682\u65f6\u65e0\u6cd5\u5c55\u793a\u989d\u5916\u53d8\u91cf\u8868\u5355\u3002"}
            </div>
          ) : null}

          {!loading && !error
            ? visibleFormFields.map(({ field, key }, index) => {
                const label = getText(field.config.label, key)
                const placeholder = getText(field.config.placeholder, `\u8bf7\u8f93\u5165 ${label}`)
                const helperError = submitted ? validateField(field, values[key]) : null
                const fieldDomKey = `${key}-${index}`

                return (
                  <div key={fieldDomKey} className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text)]">
                      {label}
                      {field.config.required ? <span className="ml-1 text-rose-500">*</span> : null}
                    </label>

                    <DifyEntryFormField
                      field={field}
                      fieldKey={key}
                      value={values[key]}
                      placeholder={placeholder}
                      onChange={(nextValue) => updateValue(key, nextValue)}
                    />

                    {helperError ? <p className="text-sm text-rose-600">{helperError}</p> : null}
                  </div>
                )
              })
            : null}

          {submitError ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
        </div>

        <div className="mt-6 flex justify-end border-t border-[color:var(--border)] pt-5">
          <Button
            type="button"
            className="rounded-full bg-[var(--accent)] px-6 text-white hover:bg-[color:var(--accent-strong)]"
            onClick={handleSubmit}
            disabled={loading || !!error}
          >
            {submitLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
