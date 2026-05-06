"use client"

import { useEffect, useMemo, useState } from "react"
import { LogOut, Plus, RefreshCw, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  emptyKnowledgeDraft,
  getKnowledgeConfig,
  getKnowledgeSummary,
  KNOWLEDGE_KIND_OPTIONS,
  toKnowledgeDraft,
  type KnowledgeDraft,
  type KnowledgeKind,
  type KnowledgeRecord,
} from "@/lib/admin-knowledge"

function formatUpdatedAt(value?: string | null) {
  if (!value) {
    return "刚刚"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "时间未知"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function FieldEditor({
  label,
  value,
  placeholder,
  multiline,
  rows,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  multiline?: boolean
  rows?: number
  onChange: (value: string) => void
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={rows ?? 5}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 text-sm leading-7 text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
      )}
    </label>
  )
}

export default function AdminKnowledgeConsole() {
  const [kind, setKind] = useState<KnowledgeKind>("faq")
  const [items, setItems] = useState<KnowledgeRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<KnowledgeDraft>(() => emptyKnowledgeDraft("faq"))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const config = useMemo(() => getKnowledgeConfig(kind), [kind])

  async function loadItems(nextKind: KnowledgeKind, preferredId?: string | null) {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/knowledge?kind=${encodeURIComponent(nextKind)}`, {
        cache: "no-store",
      })
      const data = (await response.json()) as { items?: KnowledgeRecord[]; error?: string }
      if (!response.ok) {
        setError(data.error || "读取知识数据失败。")
        setItems([])
        setSelectedId(null)
        setDraft(emptyKnowledgeDraft(nextKind))
        return
      }

      const nextItems = Array.isArray(data.items) ? data.items : []
      setItems(nextItems)

      const matched = preferredId ? nextItems.find((item) => item.id === preferredId) : undefined
      const active = matched || nextItems[0] || null
      setSelectedId(active?.id || null)
      setDraft(toKnowledgeDraft(nextKind, active))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "读取知识数据失败。")
      setItems([])
      setSelectedId(null)
      setDraft(emptyKnowledgeDraft(nextKind))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems(kind)
  }, [kind])

  async function handleSave() {
    setSaving(true)
    setError("")

    try {
      const response = await fetch(
        selectedId ? `/api/admin/knowledge/${kind}/${encodeURIComponent(selectedId)}` : "/api/admin/knowledge",
        {
          method: selectedId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedId ? { values: draft } : { kind, values: draft }),
        }
      )

      const data = (await response.json()) as { item?: KnowledgeRecord | null; error?: string }
      if (!response.ok || !data.item?.id) {
        setError(data.error || "保存失败。")
        return
      }

      await loadItems(kind, data.item.id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "保存失败。")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) {
      return
    }

    const confirmed = window.confirm("确定删除这条知识吗？")
    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/knowledge/${kind}/${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "删除失败。")
        return
      }

      await loadItems(kind)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。")
    } finally {
      setDeleting(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" })
    window.location.href = "/"
  }

  function handleCreateNew() {
    setSelectedId(null)
    setDraft(emptyKnowledgeDraft(kind))
    setError("")
  }

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
        <header className="surface-ring flex flex-col gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="section-kicker">Knowledge Admin</div>
            <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">校园知识维护后台</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">集中维护 FAQ、规章制度和办事流程，支持直接写入 Supabase。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => void loadItems(kind, selectedId)}>
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,360px)_minmax(0,1fr)]">
          <section className="surface-ring rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
            <div className="px-2 pb-3">
              <div className="text-sm font-semibold text-[var(--text)]">知识类型</div>
              <div className="mt-1 text-xs leading-6 text-[var(--text-muted)]">按业务类别切换维护内容。</div>
            </div>
            <div className="space-y-2">
              {KNOWLEDGE_KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    kind === option.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)]"
                  }`}
                >
                  <div className="text-sm font-medium text-[var(--text)]">{option.label}</div>
                  <div className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{option.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="surface-ring flex min-h-[720px] flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{config.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{items.length} 条记录</div>
              </div>
              <Button type="button" className="rounded-lg" onClick={handleCreateNew}>
                <Plus className="h-4 w-4" />
                新建
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? <div className="text-sm text-[var(--text-muted)]">正在加载数据...</div> : null}

              {!loading && items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-5 text-sm text-[var(--text-muted)]">
                  当前分类还没有记录，先新建一条试试。
                </div>
              ) : null}

              <div className="space-y-2">
                {items.map((item) => {
                  const summary = getKnowledgeSummary(kind, item)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id)
                        setDraft(toKnowledgeDraft(kind, item))
                      }}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        selectedId === item.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)]"
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--text)]">{summary.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-muted)]">{summary.subtitle}</div>
                      <div className="mt-2 text-[11px] text-[var(--text-muted)]">更新于 {formatUpdatedAt(item.updated_at)}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="surface-ring rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{selectedId ? "编辑记录" : "新建记录"}</div>
                <div className="text-xs text-[var(--text-muted)]">{config.description}</div>
              </div>
              <div className="flex gap-2">
                {selectedId ? (
                  <Button type="button" variant="outline" className="rounded-lg" onClick={handleDelete} disabled={deleting}>
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "删除中..." : "删除"}
                  </Button>
                ) : null}
                <Button type="button" className="rounded-lg" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              {config.fields.map((field) => (
                <FieldEditor
                  key={field.key}
                  label={field.label}
                  value={draft[field.key] ?? ""}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                  rows={field.rows}
                  onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
