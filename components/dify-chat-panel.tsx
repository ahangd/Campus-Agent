"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { PanelRightOpen, SendHorizonal, Square, Trash2 } from "lucide-react"

import AgentMonitor, { ToolEvent, type InspectorTab } from "@/components/agent-monitor"
import DifyChatHistorySidebar from "@/components/dify-chat-history-sidebar"
import DifyChatMessageList from "@/components/dify-chat-message-list"
import { Button } from "@/components/ui/button"
import type { ChatCopy } from "@/lib/chat-copy"
import {
  appendUserAndPendingAssistant,
  buildDifyChatRequestBody,
  closeAssistantThought,
  createStreamPayloadHandler,
  MISSING_IDENTITY_ERROR,
  normalizeSendQuery,
  SEND_QUERY_ERROR,
} from "@/lib/dify-chat-request"
import {
  buildOpenedSessionState,
  buildPersistedHistoryItems,
  buildRemovedHistoryResult,
  buildResetSessionState,
  createLocalSessionId,
  createPendingAssistantMessage,
  createWelcomeMessages,
  getOrCreateUserId,
  getStoredHistoryItems,
  resizeComposerTextarea,
  saveStoredHistoryItems,
  type StoredHistoryItem,
  updateLastAssistantMessage,
} from "@/lib/dify-chat-panel-support"
import { splitInspectorBlocks } from "@/lib/agent-inspector"
import {
  groupHistoryItems,
} from "@/lib/dify-chat-history"
import {
  PENDING_QUERY_STORAGE_KEY,
} from "@/lib/dify-chat-state"
import {
  buildReflection,
  calculateTotalDuration,
  findLatestAssistantMessage,
  parseToolEvents,
  removeEmptyPendingAssistant,
  type AssistantChatMessage,
  type ChatMessage,
} from "@/lib/dify-chat-message"
import { streamDifyChatResponse } from "@/lib/dify-chat-stream"
import { hasContextIdentity as hasRequiredIdentityInSession, restoreStoredAgentInputs as getStoredInputsFromSession } from "@/lib/context-manager"
import { formatObservationBlock } from "@/lib/dify-observation"
import { normalizeRecentUserQueries } from "@/lib/query-rewrite"

const MAX_HISTORY_ITEMS = 30
const SHORTCUT_COMMANDS = ["/\u7f13\u8003\u7533\u8bf7", "/\u67e5\u8be2\u7a7a\u6559\u5ba4", "/\u63a8\u8350\u9009\u4fee"] as const

function ChatComposer({
  inputId,
  input,
  streaming,
  placeholder,
  stopLabel,
  sendLabel,
  textareaRef,
  onInputChange,
  onSubmit,
  onStop,
  onShortcutSelect,
}: {
  inputId: string
  input: string
  streaming: boolean
  placeholder: string
  stopLabel: string
  sendLabel: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInputChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  onShortcutSelect: (value: string) => void
}) {
  return (
    <div className="border-t border-[color:var(--border)] px-4 py-3">
      <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
        <label htmlFor={inputId} className="sr-only">
          {placeholder}
        </label>
        <textarea
          id={inputId}
          ref={textareaRef}
          rows={1}
          value={input}
          disabled={streaming}
          placeholder={placeholder}
          className="max-h-[220px] min-h-[48px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              onSubmit()
            }
          }}
        />

        <div className="mt-3 flex flex-col gap-3 border-t border-[color:var(--border)] pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            {SHORTCUT_COMMANDS.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 transition hover:bg-[color:var(--surface-2)]"
                onClick={() => onShortcutSelect(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end">
            {streaming ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface)]"
                onClick={onStop}
              >
                <Square className="h-4 w-4" />
                {stopLabel}
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full bg-[var(--accent)] px-5 text-white hover:bg-[color:var(--accent-strong)]"
                onClick={onSubmit}
                disabled={!input.trim()}
              >
                {sendLabel}
                <SendHorizonal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DifyChatPanel({ copy, threadId }: { copy: ChatCopy; threadId?: string }) {
  const inputId = useId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const skipNextPersistRef = useRef(false)
  const ignoreNextThreadSyncRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  const [messages, setMessages] = useState<ChatMessage[]>(createWelcomeMessages(copy))
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [localSessionId, setLocalSessionId] = useState(() => threadId || createLocalSessionId())
  const [historyItems, setHistoryItems] = useState<StoredHistoryItem[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("plan")
  const [inspectorOpen, setInspectorOpen] = useState(true)

  const syncRoute = useCallback(
    (id: string) => {
      const target = `/chat?thread=${encodeURIComponent(id)}`
      if (pathname !== target) {
        router.replace(target)
      }
    },
    [pathname, router]
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const applySessionState = useCallback(
    (
      nextState:
        | ReturnType<typeof buildResetSessionState>
        | ReturnType<typeof buildOpenedSessionState>
    ) => {
      setConversationId(nextState.conversationId)
      setLocalSessionId(nextState.localSessionId)
      setError(nextState.error)
      setMessages(nextState.messages)

      if ("streaming" in nextState) {
        setStreaming(nextState.streaming)
      }

      if ("inspectorTab" in nextState) {
        setInspectorTab(nextState.inspectorTab)
      }
    },
    []
  )

  const resetSessionState = useCallback(
    (nextSessionId: string) => {
      applySessionState(buildResetSessionState(copy, nextSessionId))
    },
    [applySessionState, copy]
  )

  const openHistorySession = useCallback(
    (item: StoredHistoryItem) => {
      applySessionState(buildOpenedSessionState(item))
      syncRoute(item.id)
    },
    [applySessionState, syncRoute]
  )

  const persistCurrentSession = useCallback(
    (nextMessages: ChatMessage[], nextConversationId: string | null) => {
      const nextHistoryItems = buildPersistedHistoryItems({
        sessionId: localSessionId,
        messages: nextMessages,
        conversationId: nextConversationId,
        welcomeUser: copy.welcomeUser,
        welcomeAgent: copy.welcomeAgent,
        maxItems: MAX_HISTORY_ITEMS,
      })
      if (!nextHistoryItems) return
      saveStoredHistoryItems(nextHistoryItems)
      setHistoryItems(nextHistoryItems)
    },
    [copy.welcomeAgent, copy.welcomeUser, localSessionId]
  )

  const removeHistorySession = useCallback(
    (targetId: string) => {
      stopStream()

      const { nextHistoryItems, nextSessionAction } = buildRemovedHistoryResult({
        targetId,
        currentSessionId: localSessionId,
        threadId,
      })
      saveStoredHistoryItems(nextHistoryItems)
      setHistoryItems(nextHistoryItems)

      if (nextSessionAction.type === "keep-current") return

      skipNextPersistRef.current = true

      if (nextSessionAction.type === "open-history") {
        openHistorySession(nextSessionAction.item)
        return
      }

      ignoreNextThreadSyncRef.current = true
      const nextSessionId = createLocalSessionId()
      resetSessionState(nextSessionId)
      syncRoute(nextSessionId)
    },
    [localSessionId, openHistorySession, resetSessionState, stopStream, syncRoute, threadId]
  )

  const newSession = useCallback(() => {
    stopStream()
    ignoreNextThreadSyncRef.current = true
    const nextSessionId = createLocalSessionId()
    resetSessionState(nextSessionId)
    syncRoute(nextSessionId)
  }, [resetSessionState, stopStream, syncRoute])

  const sendQuery = useCallback(
    async (rawQuery: string) => {
      const query = normalizeSendQuery(rawQuery, streaming)
      if (!query) return

      const storedInputs = getStoredInputsFromSession()
      if (!hasRequiredIdentityInSession({ formValues: storedInputs })) {
        setError(MISSING_IDENTITY_ERROR)
        return
      }

      setError(null)
      if (rawQuery === input) {
        setInput("")
      }
      setStreaming(true)

      setMessages((prev) => appendUserAndPendingAssistant(prev, query, createPendingAssistantMessage()))
      setInspectorTab("plan")

      const controller = new AbortController()
      abortRef.current = controller

      const updateAssistant = (updater: (message: AssistantChatMessage) => AssistantChatMessage) => {
        setMessages((prev) => updateLastAssistantMessage(prev, updater))
      }

      const handleStreamPayload = createStreamPayloadHandler({
        updateAssistantMessage: updateAssistant,
        setConversationId,
      })

      try {
        const recentUserQueries = normalizeRecentUserQueries(
          messages
            .filter((item): item is Extract<ChatMessage, { role: "user" }> => item.role === "user")
            .map((item) => item.content)
        )

        const response = await fetch("/api/dify/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(buildDifyChatRequestBody({
            query,
            conversationId,
            inputs: storedInputs,
            user: getOrCreateUserId(),
            recentUserQueries,
          })),
        })

        await streamDifyChatResponse(response, handleStreamPayload)
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") return

        const message = requestError instanceof Error ? requestError.message : SEND_QUERY_ERROR
        setError(message)
        setMessages((prev) => removeEmptyPendingAssistant(prev))
      } finally {
        closeAssistantThought(updateAssistant)
        setStreaming(false)
        abortRef.current = null
      }
    },
    [conversationId, input, messages, streaming]
  )

  useEffect(() => {
    setHistoryItems(getStoredHistoryItems())
  }, [])

  useEffect(() => {
    try {
      const pending = window.localStorage.getItem(PENDING_QUERY_STORAGE_KEY)
      if (!pending?.trim()) return

      window.localStorage.removeItem(PENDING_QUERY_STORAGE_KEY)
      void sendQuery(pending)
    } catch {
      // Ignore localStorage read failure.
    }
  }, [sendQuery])

  useEffect(() => {
    if (!threadId || threadId === localSessionId) return
    if (ignoreNextThreadSyncRef.current) {
      ignoreNextThreadSyncRef.current = false
      return
    }

    const matchedItem = getStoredHistoryItems().find((item) => item.id === threadId)
    if (matchedItem) {
      openHistorySession(matchedItem)
    }
  }, [localSessionId, openHistorySession, threadId])

  useEffect(() => {
    if (streaming) return
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    persistCurrentSession(messages, conversationId)
  }, [conversationId, messages, persistCurrentSession, streaming])

  useEffect(() => {
    resizeComposerTextarea(textareaRef.current)
  }, [input])

  const groupedHistory = useMemo(() => groupHistoryItems(historyItems), [historyItems])

  const latestAssistantMessage = useMemo(() => {
    return findLatestAssistantMessage(messages)
  }, [messages])

  const toolEvents = useMemo<ToolEvent[]>(() => parseToolEvents(latestAssistantMessage), [latestAssistantMessage])
  const reflection = useMemo(() => buildReflection(latestAssistantMessage), [latestAssistantMessage])
  const totalDuration = useMemo(() => calculateTotalDuration(latestAssistantMessage?.toolDurations), [latestAssistantMessage?.toolDurations])
  const formattedEvidenceBlocks = useMemo(
    () => (splitInspectorBlocks(latestAssistantMessage?.queryLog || "") as string[]).map((item: string) => formatObservationBlock(item).formatted),
    [latestAssistantMessage?.queryLog]
  )

  const send = useCallback(async () => {
    await sendQuery(input)
  }, [input, sendQuery])

  return (
    <div
      className={`grid min-h-[calc(100vh-96px)] gap-3 ${
        inspectorOpen ? "xl:grid-cols-[280px_minmax(0,1fr)_320px]" : "xl:grid-cols-[280px_minmax(0,1fr)]"
      }`}
    >
      <DifyChatHistorySidebar
        copy={copy}
        streaming={streaming}
        historyItems={historyItems}
        groupedHistory={groupedHistory}
        localSessionId={localSessionId}
        onNewSession={newSession}
        onOpenSession={openHistorySession}
        onDeleteSession={removeHistorySession}
      />

      <section className="surface-ring flex min-h-[640px] flex-col rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] px-4 py-3">
          <div>
            <div className="text-sm text-[var(--text-muted)]">{copy.chatWindow}</div>
            <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.03em]">{copy.chatTitle}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!inspectorOpen ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[color:var(--surface-2)]"
                onClick={() => setInspectorOpen(true)}
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
                Inspector
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[color:var(--surface-2)]"
              onClick={() => removeHistorySession(localSessionId)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {copy.deleteAction}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <DifyChatMessageList
          copy={copy}
          messages={messages}
          streaming={streaming}
          onSelectSuggestion={(value) => void sendQuery(value)}
          onOpenEvidence={() => {
            setInspectorOpen(true)
            setInspectorTab("evidence")
          }}
        />

        <ChatComposer
          inputId={inputId}
          input={input}
          streaming={streaming}
          placeholder={copy.placeholder}
          stopLabel={copy.stop}
          sendLabel={copy.send}
          textareaRef={textareaRef}
          onInputChange={setInput}
          onSubmit={() => void send()}
          onStop={stopStream}
          onShortcutSelect={setInput}
        />
      </section>

      <AgentMonitor
        thoughtLog={latestAssistantMessage?.thoughtLog}
        queryLog={formattedEvidenceBlocks.join("\n\n---\n\n")}
        toolEvents={toolEvents}
        reflection={reflection}
        totalDuration={totalDuration ?? undefined}
        isOpen={inspectorOpen}
        onToggle={() => setInspectorOpen((value) => !value)}
        defaultTab={inspectorTab}
      />
    </div>
  )
}
