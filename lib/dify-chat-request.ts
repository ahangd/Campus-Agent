import type { DifySsePayload } from "./dify-chat-stream.ts"
import { appendUniqueBlock } from "./dify-chat-state.ts"
import { buildThoughtBlock, sanitizeAssistantAnswer, type AssistantChatMessage, type ChatMessage } from "./dify-chat-message.ts"

export const MISSING_IDENTITY_ERROR = "\u8bf7\u5148\u8fd4\u56de\u9996\u9875\u586b\u5199\u59d3\u540d\u548c\u5b66\u53f7\uff0c\u518d\u5f00\u59cb\u5bf9\u8bdd\u3002"
export const DIFY_EVENT_ERROR = "Dify \u8fd4\u56de\u4e86\u9519\u8bef\u4e8b\u4ef6\u3002"
export const SEND_QUERY_ERROR = "\u53d1\u9001\u5931\u8d25\u3002"

export type EvalMode = "full" | "no_rewrite" | "llm_only"

export function normalizeSendQuery(rawQuery: string, streaming: boolean) {
  const query = rawQuery.trim()
  if (!query || streaming) {
    return null
  }

  return query
}

export function normalizeEvalMode(value: unknown): EvalMode {
  if (value === "no_rewrite" || value === "llm_only") {
    return value
  }

  return "full"
}

export function buildDifyChatRequestBody({
  query,
  conversationId,
  inputs,
  user,
  recentUserQueries,
  evalMode,
}: {
  query: string
  conversationId: string | null
  inputs: Record<string, unknown>
  user: string
  recentUserQueries?: string[]
  evalMode?: EvalMode
}) {
  const body = {
    query,
    conversationId,
    inputs,
    user,
  }

  const withRecentQueries = recentUserQueries?.length
    ? {
        ...body,
        recentUserQueries,
      }
    : body

  if (evalMode && evalMode !== "full") {
    return {
      ...withRecentQueries,
      evalMode,
    }
  }

  return withRecentQueries
}

export function createStreamPayloadHandler({
  updateAssistantMessage,
  setConversationId,
}: {
  updateAssistantMessage: (updater: (message: AssistantChatMessage) => AssistantChatMessage) => void
  setConversationId: (value: string) => void
}) {
  let assistantBuffer = ""

  return async (data: DifySsePayload) => {
    if ((data.event === "message" || data.event === "agent_message") && typeof data.answer === "string") {
      assistantBuffer += data.answer
      const text = sanitizeAssistantAnswer(assistantBuffer)
      updateAssistantMessage((last) => ({ ...last, answer: text }))
    }

    if (data.event === "agent_thought") {
      const { thoughtBlock, observation } = buildThoughtBlock(data)
      updateAssistantMessage((last) => ({
        ...last,
        thoughtLog: appendUniqueBlock(last.thoughtLog, thoughtBlock, "\n\n---\n\n"),
        queryLog: appendUniqueBlock(last.queryLog, observation, "\n\n"),
        thoughtOpen: true,
      }))
    }

    if (typeof data.conversation_id === "string" && data.conversation_id) {
      setConversationId(data.conversation_id)
    }

    if (data.event === "error") {
      throw new Error(data.message || data.code || DIFY_EVENT_ERROR)
    }

    if (data.event === "message_end") {
      updateAssistantMessage((last) => ({ ...last, thoughtOpen: false }))
    }
  }
}

export function closeAssistantThought(updateAssistantMessage: (updater: (message: AssistantChatMessage) => AssistantChatMessage) => void) {
  updateAssistantMessage((last) => ({ ...last, thoughtOpen: false }))
}

export function appendUserAndPendingAssistant(messages: ChatMessage[], query: string, pendingAssistant: AssistantChatMessage) {
  return [...messages, { role: "user", content: query } satisfies ChatMessage, pendingAssistant]
}
