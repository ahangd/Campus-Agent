import type { ChatCopy } from "@/lib/chat-copy"
import { buildNextHistoryItems, createHistoryTitle, removeHistoryItemsById, type StoredHistoryItem as BaseStoredHistoryItem } from "@/lib/dify-chat-history"
import { CHAT_HISTORY_STORAGE_KEY, createBrowserId, getOrCreateBrowserStoredId, readStoredArray, updateLastMatchingItem, writeStoredValue } from "@/lib/dify-chat-state"
import { isAssistantMessage, type AssistantChatMessage, type ChatMessage } from "@/lib/dify-chat-message"

export type StoredHistoryItem = BaseStoredHistoryItem<ChatMessage>

const CHAT_TEXTAREA_MAX_HEIGHT = 220

export function createLocalSessionId() {
  return createBrowserId("session")
}

export function createWelcomeMessages(copy: ChatCopy): ChatMessage[] {
  return [
    { role: "user", content: copy.welcomeUser },
    { role: "assistant", answer: copy.welcomeAgent, thoughtLog: "", queryLog: "", thoughtOpen: false },
  ]
}

export function createPendingAssistantMessage(): AssistantChatMessage {
  return { role: "assistant", answer: "", thoughtLog: "", queryLog: "", thoughtOpen: true }
}

export function updateLastAssistantMessage(messages: ChatMessage[], updater: (message: AssistantChatMessage) => AssistantChatMessage) {
  return updateLastMatchingItem(messages, isAssistantMessage, (message) => updater(message as AssistantChatMessage))
}

export function getStoredHistoryItems() {
  return readStoredArray<StoredHistoryItem>(CHAT_HISTORY_STORAGE_KEY)
}

export function saveStoredHistoryItems(items: StoredHistoryItem[]) {
  writeStoredValue(CHAT_HISTORY_STORAGE_KEY, items)
}

export function getOrCreateUserId() {
  return getOrCreateBrowserStoredId("user")
}

export function resizeComposerTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return
  element.style.height = "0px"
  element.style.height = `${Math.min(element.scrollHeight, CHAT_TEXTAREA_MAX_HEIGHT)}px`
}

export function buildHistorySnapshot({
  sessionId,
  messages,
  conversationId,
  welcomeUser,
  welcomeAgent,
}: {
  sessionId: string
  messages: ChatMessage[]
  conversationId: string | null
  welcomeUser: string
  welcomeAgent: string
}): StoredHistoryItem | null {
  const meaningfulMessages = messages.filter(
    (message) => !(message.role === "assistant" && message.answer === welcomeAgent && !message.thoughtLog && !message.queryLog)
  )

  if (meaningfulMessages.length <= 1) {
    return null
  }

  return {
    id: sessionId,
    title: createHistoryTitle(meaningfulMessages, welcomeUser),
    updatedAt: Date.now(),
    conversationId,
    messages,
  }
}

export function buildPersistedHistoryItems({
  sessionId,
  messages,
  conversationId,
  welcomeUser,
  welcomeAgent,
  maxItems,
}: {
  sessionId: string
  messages: ChatMessage[]
  conversationId: string | null
  welcomeUser: string
  welcomeAgent: string
  maxItems: number
}) {
  const item = buildHistorySnapshot({
    sessionId,
    messages,
    conversationId,
    welcomeUser,
    welcomeAgent,
  })

  if (!item) {
    return null
  }

  return buildNextHistoryItems(sessionId, item, getStoredHistoryItems(), maxItems)
}

export function buildOpenedSessionState(item: StoredHistoryItem) {
  return {
    messages: item.messages,
    conversationId: item.conversationId,
    localSessionId: item.id,
    error: null as string | null,
  }
}

export function buildResetSessionState(copy: ChatCopy, nextSessionId: string) {
  return {
    conversationId: null as string | null,
    localSessionId: nextSessionId,
    error: null as string | null,
    streaming: false,
    messages: createWelcomeMessages(copy),
    inspectorTab: "plan" as const,
  }
}

export function resolveNextSessionAfterRemoval({
  targetId,
  currentSessionId,
  nextHistoryItems,
  threadId,
}: {
  targetId: string
  currentSessionId: string
  nextHistoryItems: StoredHistoryItem[]
  threadId?: string
}) {
  if (targetId !== currentSessionId) {
    return { type: "keep-current" as const }
  }

  if (threadId) {
    const fallback = nextHistoryItems[0]
    if (fallback) {
      return { type: "open-history" as const, item: fallback }
    }
  }

  return { type: "reset-session" as const }
}

export function buildRemovedHistoryResult({
  targetId,
  currentSessionId,
  threadId,
}: {
  targetId: string
  currentSessionId: string
  threadId?: string
}) {
  const nextHistoryItems = removeHistoryItemsById(targetId, getStoredHistoryItems())
  const nextSessionAction = resolveNextSessionAfterRemoval({
    targetId,
    currentSessionId,
    nextHistoryItems,
    threadId,
  })

  return { nextHistoryItems, nextSessionAction }
}
