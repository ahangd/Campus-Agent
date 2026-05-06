"use client"

import { useMemo, useState } from "react"
import { FileSearch, Sparkles } from "lucide-react"

import type { ChatCopy } from "@/lib/chat-copy"
import { splitInspectorBlocks } from "@/lib/agent-inspector"
import { formatObservationBlock } from "@/lib/dify-observation"
import {
  extractLocalKnowledgeSources,
  inferConfidence,
  isAssistantMessage,
  sanitizeInspectorText,
  type LocalKnowledgeSource,
  type AssistantChatMessage,
  type ChatMessage,
} from "@/lib/dify-chat-message"

function getSourceBadgeClassName(source: LocalKnowledgeSource) {
  if (source.kind === "faq") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
  }

  if (source.kind === "regulations") {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
  }

  if (source.kind === "service_process") {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300"
  }

  return "border-[color:var(--border)] bg-[var(--accent-soft)] text-[var(--accent)] hover:border-[var(--accent)]"
}

function EmptyChatState({
  title,
  description,
  suggestions,
  onSelectSuggestion,
}: {
  title: string
  description: string
  suggestions: readonly string[]
  onSelectSuggestion: (value: string) => void
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(47,107,255,0.05),rgba(255,255,255,0.8))] px-5 py-7 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--accent-soft)] text-[var(--accent)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-[1.35rem] font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-1.5 text-sm text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[color:var(--surface-2)]"
            onClick={() => onSelectSuggestion(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function EvidencePreviewCard({
  content,
  active,
  onOpenInspector,
}: {
  content: string
  active: boolean
  onOpenInspector: () => void
}) {
  return (
    <button
      type="button"
      className={`rounded-[18px] border px-4 py-3 text-left text-sm leading-6 text-[var(--text-muted)] transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)]"
      }`}
      onClick={onOpenInspector}
    >
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <FileSearch className="h-3.5 w-3.5" />
        {"\u8bc1\u636e\u7247\u6bb5"}
      </div>
      <div className={active ? "" : "line-clamp-4"}>{content}</div>
    </button>
  )
}

function ThoughtPreviewCard({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
      <div className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssistantMessageCard({
  message,
  streaming,
  isLatest,
  copy,
  onOpenEvidence,
}: {
  message: AssistantChatMessage
  streaming: boolean
  isLatest: boolean
  copy: ChatCopy
  onOpenEvidence: () => void
}) {
  const confidence = inferConfidence(message, copy)
  const thoughtBlocks = useMemo(
    () => splitInspectorBlocks(sanitizeInspectorText(message.thoughtLog)) as string[],
    [message.thoughtLog]
  )
  const evidenceBlocks = splitInspectorBlocks(message.queryLog) as string[]
  const localKnowledgeSources = extractLocalKnowledgeSources(message)
  const formattedEvidenceBlocks = useMemo(
    () => evidenceBlocks.map((item: string) => formatObservationBlock(item)),
    [evidenceBlocks]
  )
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState<number | null>(null)

  const localKnowledgeEvidenceIndex = useMemo(
    () => formattedEvidenceBlocks.findIndex((item) => item.toolName === "local_knowledge_lookup"),
    [formattedEvidenceBlocks]
  )

  return (
    <div
      className={`rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 ${
        streaming && isLatest ? "assistant-shimmer" : ""
      }`}
    >
      {thoughtBlocks.length > 0 ? (
        <details className="mb-4 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4" open={message.thoughtOpen}>
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text)]">{copy.thinkingProcess}</summary>
          <div className="mt-3 grid gap-3">
            {thoughtBlocks.map((item, index) => (
              <ThoughtPreviewCard key={`${item}-${index}`} content={item} />
            ))}
          </div>
        </details>
      ) : null}

      <div className="border-l-2 border-[var(--accent)] pl-4 text-sm leading-7 text-[var(--text)]">
        {message.answer || (streaming && isLatest ? "\u6b63\u5728\u751f\u6210..." : "")}
      </div>

      {(message.queryLog || message.thoughtLog) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs ${confidence.className}`}>
            {"\u7f6e\u4fe1\u5ea6"} {confidence.label}
          </span>
          {message.queryLog ? (
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
              {`\u8bc1\u636e ${evidenceBlocks.length} \u6761`}
            </span>
          ) : null}
        </div>
      )}

      {localKnowledgeSources.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-[var(--text)]">参考来源</div>
          <div className="flex flex-wrap gap-2">
            {localKnowledgeSources.map((source) => (
              <button
                key={`${source.kind}-${source.title}`}
                type="button"
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition ${getSourceBadgeClassName(source)}`}
                title={source.title}
                onClick={() => {
                  if (localKnowledgeEvidenceIndex >= 0) {
                    setActiveEvidenceIndex(localKnowledgeEvidenceIndex)
                  }
                  onOpenEvidence()
                }}
              >
                {source.kindLabel} · {source.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {message.queryLog ? (
        <div className="mt-5 space-y-3">
          <div className="text-sm font-medium text-[var(--text)]">{copy.queryResults}</div>
          <div className="grid gap-3">
            {formattedEvidenceBlocks
              .slice(0, 3)
              .map((item, index) => (
                <EvidencePreviewCard
                  key={`${item.toolName || "evidence"}-${index}`}
                  content={item.formatted}
                  active={activeEvidenceIndex === index}
                  onOpenInspector={onOpenEvidence}
                />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function UserMessageBubble({ content }: { content: string }) {
  return <div className="rounded-[24px] bg-[var(--accent-soft)] px-5 py-4 text-sm leading-7 text-[var(--text)]">{content}</div>
}

export default function DifyChatMessageList({
  copy,
  messages,
  streaming,
  onSelectSuggestion,
  onOpenEvidence,
}: {
  copy: ChatCopy
  messages: ChatMessage[]
  streaming: boolean
  onSelectSuggestion: (value: string) => void
  onOpenEvidence: () => void
}) {
  return (
    <div className="chat-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4">
      {messages.length <= 2 ? (
        <EmptyChatState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          suggestions={copy.suggestions}
          onSelectSuggestion={onSelectSuggestion}
        />
      ) : null}

      {messages.map((message, index) => {
        const key = `${index}-${message.role}-${isAssistantMessage(message) ? message.answer.slice(0, 16) : message.content.slice(0, 16)}`

        return (
          <div key={key} className={message.role === "assistant" ? "" : "flex justify-end"}>
            <div className={message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"}>
              <div
                className={
                  message.role === "assistant"
                    ? "mb-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    : "mb-2 text-right text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]"
                }
              >
                {message.role === "assistant" ? copy.agentRoleLabel : copy.userRoleLabel}
              </div>

              {isAssistantMessage(message) ? (
                <AssistantMessageCard
                  message={message}
                  streaming={streaming}
                  isLatest={index === messages.length - 1}
                  copy={copy}
                  onOpenEvidence={onOpenEvidence}
                />
              ) : (
                <UserMessageBubble content={message.content} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
