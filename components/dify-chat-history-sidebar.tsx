"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ChatCopy } from "@/lib/chat-copy"
import { getHistoryGroupLabel, type HistoryGroupKey, type StoredHistoryItem } from "@/lib/dify-chat-history"
import type { ChatMessage } from "@/lib/dify-chat-message"

function HistorySessionItem({
  item,
  active,
  deleteLabel,
  onOpen,
  onDelete,
}: {
  item: StoredHistoryItem<ChatMessage>
  active: boolean
  deleteLabel: string
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-[18px] border p-1.5 transition ${
        active
          ? "border-[color:var(--accent)] bg-[var(--accent-soft)]"
          : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)]"
      }`}
    >
      <button type="button" className="min-w-0 flex-1 rounded-[14px] px-2 py-1 text-left" onClick={onOpen}>
        <div className="line-clamp-2 text-sm font-medium text-[var(--text)]">{item.title}</div>
        <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">{new Date(item.updatedAt).toLocaleString()}</div>
      </button>
      <button
        type="button"
        aria-label={deleteLabel}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[var(--text-muted)] transition hover:bg-rose-50 hover:text-rose-600"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function DifyChatHistorySidebar({
  copy,
  streaming,
  historyItems,
  groupedHistory,
  localSessionId,
  onNewSession,
  onOpenSession,
  onDeleteSession,
}: {
  copy: ChatCopy
  streaming: boolean
  historyItems: StoredHistoryItem<ChatMessage>[]
  groupedHistory: Record<HistoryGroupKey, StoredHistoryItem<ChatMessage>[]>
  localSessionId: string
  onNewSession: () => void
  onOpenSession: (item: StoredHistoryItem<ChatMessage>) => void
  onDeleteSession: (id: string) => void
}) {
  return (
    <aside className="surface-ring flex min-h-[640px] flex-col rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="border-b border-[color:var(--border)] p-4">
        <div className="text-sm text-[var(--text-muted)]">{copy.workspaceLabel}</div>
        <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.03em]">{copy.workspaceTitle}</h2>
        <Button
          type="button"
          className="mt-4 h-10 w-full rounded-full bg-[var(--accent)] text-white hover:bg-[color:var(--accent-strong)]"
          onClick={onNewSession}
          disabled={streaming}
        >
          <Plus className="h-4 w-4" />
          {copy.newSession}
        </Button>
      </div>

      <div className="chat-scroll flex-1 overflow-y-auto p-3.5">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
          <span>{copy.history}</span>
          <span>{historyItems.length}</span>
        </div>

        {(["today", "week", "earlier"] as HistoryGroupKey[]).map((group) => {
          const items = groupedHistory[group]
          if (!items.length) return null

          return (
            <div key={group} className="mb-5">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {getHistoryGroupLabel(group, copy)}
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <HistorySessionItem
                    key={item.id}
                    item={item}
                    active={item.id === localSessionId}
                    deleteLabel={copy.deleteAction}
                    onOpen={() => onOpenSession(item)}
                    onDelete={() => onDeleteSession(item.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
