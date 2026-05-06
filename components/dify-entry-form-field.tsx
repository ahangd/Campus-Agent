"use client"

import { getStringValue, normalizeOptions, type NormalizedField } from "@/lib/dify-entry-form"

type DifyEntryFormFieldProps = {
  field: NormalizedField
  fieldKey: string
  value: unknown
  placeholder: string
  onChange: (value: unknown) => void
}

export default function DifyEntryFormField({
  field,
  fieldKey,
  value,
  placeholder,
  onChange,
}: DifyEntryFormFieldProps) {
  const options = normalizeOptions(field.config.options)

  if (field.type === "text-input" || field.type === "secret-input") {
    return (
      <input
        type={field.type === "secret-input" ? "password" : "text"}
        className="h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        placeholder={placeholder}
        value={getStringValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (field.type === "paragraph") {
    return (
      <textarea
        className="min-h-32 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        placeholder={placeholder}
        value={getStringValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className="h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        placeholder={placeholder}
        value={value === "" || value === undefined ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (field.type === "select") {
    return (
      <select
        className="h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{"\u8bf7\u9009\u62e9"}</option>
        {options.map((option) => (
          <option key={`${fieldKey}-${String(option.value)}`} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === "radio") {
    return (
      <div className="space-y-2 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        {options.map((option) => (
          <label key={`${fieldKey}-${String(option.value)}`} className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <input
              type="radio"
              name={fieldKey}
              checked={String(value ?? "") === String(option.value)}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    )
  }

  if (field.type === "checkbox" || field.type === "switch") {
    return (
      <label className="flex min-h-12 items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span>{placeholder}</span>
      </label>
    )
  }

  if (field.type === "json") {
    return (
      <textarea
        className="min-h-36 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 font-mono text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        placeholder={placeholder}
        value={getStringValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <input
      type="text"
      className="h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
      placeholder={placeholder}
      value={getStringValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
