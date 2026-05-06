import type { ChatCopy } from "./chat-copy"
import { splitInspectorBlocks } from "./agent-inspector.ts"
import { formatObservationBlock } from "./dify-observation.ts"

const TOOL_PREFIX = "\u5de5\u5177:"
const INPUT_PREFIX = "\u8f93\u5165:"

export type ToolDuration = { name: string; duration: number }

export type UserChatMessage = {
  role: "user"
  content: string
}

export type AssistantChatMessage = {
  role: "assistant"
  answer: string
  thoughtLog: string
  queryLog: string
  thoughtOpen: boolean
  toolDurations?: ToolDuration[]
}

export type ChatMessage = UserChatMessage | AssistantChatMessage

export type ReflectionScores = {
  groundedness: number
  completeness: number
  correctness: number
  tone: number
  safety: number
  advice: string
}

export type ParsedToolEvent = {
  name: string
  input: string
  result: string
  duration: number | null
}

export type LocalKnowledgeSource = {
  title: string
  kind: string
  kindLabel: string
}

export type ThoughtEventPayload = {
  thought?: string
  tool?: string
  tool_input?: unknown
  observation?: string
}

export function isAssistantMessage(message: ChatMessage): message is AssistantChatMessage {
  return message.role === "assistant"
}

export function sanitizeAssistantAnswer(raw: string) {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "")
  const danglingOpenTagIndex = text.toLowerCase().lastIndexOf("<think>")
  if (danglingOpenTagIndex >= 0) {
    text = text.slice(0, danglingOpenTagIndex)
  }

  text = text.replace(/<\/?think>/gi, "")
  return text.trim()
}

export function sanitizeInspectorText(raw: string) {
  return sanitizeAssistantAnswer(raw)
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function inferConfidence(message: AssistantChatMessage, copy: ChatCopy) {
  if (message.queryLog.trim()) {
    return { label: copy.confidenceHigh, className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  }

  if (message.thoughtLog.trim()) {
    return { label: copy.confidenceMedium, className: "bg-amber-50 text-amber-700 border-amber-200" }
  }

  return { label: copy.confidenceLow, className: "bg-slate-100 text-slate-600 border-slate-200" }
}

export function parseToolEvents(message: AssistantChatMessage | null): ParsedToolEvent[] {
  if (!message?.thoughtLog) return []

  const evidenceBlocks = (splitInspectorBlocks(message.queryLog) as string[]).map((block: string) => formatObservationBlock(block))

  return (splitInspectorBlocks(message.thoughtLog) as string[])
    .map((block: string): ParsedToolEvent | null => {
      const lines = block.split("\n").map((line: string) => line.trim())
      const toolLine = lines.find((line) => line.startsWith(TOOL_PREFIX))
      if (!toolLine) return null

      const toolName = toolLine.replace(TOOL_PREFIX, "").trim()
      const inputLine = lines.find((line) => line.startsWith(INPUT_PREFIX))
      const result =
        evidenceBlocks.find((item: ReturnType<typeof formatObservationBlock>) => item.toolName?.toLowerCase() === toolName.toLowerCase())?.formatted ||
        evidenceBlocks[0]?.formatted ||
        "\u672c\u8f6e\u6ca1\u6709\u5355\u72ec\u7684\u5de5\u5177\u7ed3\u679c\u6458\u8981\u3002"

      return {
        name: toolName,
        input: inputLine?.replace(INPUT_PREFIX, "").trim() || "{}",
        result,
        duration: message.toolDurations?.find((item) => item.name === toolName)?.duration || null,
      }
    })
    .filter((item: ParsedToolEvent | null): item is ParsedToolEvent => Boolean(item))
}

function toKindLabel(kind: string) {
  if (kind === "faq") return "FAQ"
  if (kind === "regulations") return "规章制度"
  if (kind === "service_process") return "办事流程"
  return "知识"
}

export function extractLocalKnowledgeSources(message: AssistantChatMessage | null): LocalKnowledgeSource[] {
  if (!message?.queryLog) return []

  const seen = new Set<string>()
  const sources: LocalKnowledgeSource[] = []

  for (const block of splitInspectorBlocks(message.queryLog) as string[]) {
    const observation = formatObservationBlock(block)
    if (observation.toolName !== "local_knowledge_lookup") {
      continue
    }

    const records = Array.isArray(observation.result) ? observation.result : []
    for (const item of records) {
      if (!item || typeof item !== "object") {
        continue
      }

      const record = item as Record<string, unknown>
      const title = typeof record.title === "string" ? record.title.trim() : ""
      const kind = typeof record.kind === "string" ? record.kind.trim() : ""
      if (!title) {
        continue
      }

      const key = `${kind}:${title}`
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      sources.push({
        title,
        kind,
        kindLabel: toKindLabel(kind),
      })
    }
  }

  return sources
}

export function calculateTotalDuration(toolDurations?: ToolDuration[]) {
  if (!toolDurations?.length) return null
  return toolDurations.reduce((total, tool) => total + (tool.duration || 0), 0)
}

export function buildReflection(message: AssistantChatMessage | null): ReflectionScores {
  const evidenceCount = splitInspectorBlocks(message?.queryLog || "").length
  const thoughtCount = splitInspectorBlocks(message?.thoughtLog || "").length
  const answerLength = message?.answer.trim().length || 0

  return {
    groundedness: Math.min(5, evidenceCount > 0 ? 4 + Math.min(1, evidenceCount / 3) : 2),
    completeness: Math.min(5, answerLength > 80 ? 4 : answerLength > 20 ? 3 : 2),
    correctness: Math.min(5, evidenceCount > 0 && thoughtCount > 0 ? 4 : 3),
    tone: 4,
    safety: 5,
    advice:
      evidenceCount === 0
        ? "\u5f53\u524d\u56de\u7b54\u66f4\u591a\u4f9d\u8d56\u901a\u7528\u751f\u6210\uff0c\u5efa\u8bae\u7ee7\u7eed\u8865\u5145\u68c0\u7d22\u8bc1\u636e\u3002"
        : "\u5f53\u524d\u56de\u7b54\u5df2\u6709\u8bc1\u636e\u652f\u6491\uff0c\u53ef\u4ee5\u7ee7\u7eed\u7ec6\u5316\u5f15\u7528\u4e0e\u7ed3\u8bba\u3002",
  }
}

export function buildThoughtBlock(data: ThoughtEventPayload) {
  const thought = typeof data.thought === "string" ? sanitizeInspectorText(data.thought) : ""
  const tool = typeof data.tool === "string" ? data.tool.trim() : ""
  const toolInput =
    typeof data.tool_input === "string"
      ? data.tool_input.trim()
      : data.tool_input !== undefined
        ? JSON.stringify(data.tool_input)
        : ""

  const thoughtLines: string[] = []
  if (thought) thoughtLines.push(thought)
  if (tool) thoughtLines.push(`${TOOL_PREFIX} ${tool}`)
  if (toolInput) thoughtLines.push(`${INPUT_PREFIX} ${toolInput}`)

  return {
    thoughtBlock: thoughtLines.join("\n"),
    observation: typeof data.observation === "string" ? sanitizeInspectorText(data.observation) : "",
  }
}

export function removeEmptyPendingAssistant<TMessage extends { role: string; answer?: string; thoughtLog?: string; queryLog?: string }>(
  messages: TMessage[]
) {
  const nextMessages = [...messages]

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    const message = nextMessages[index]
    if (
      message.role === "assistant" &&
      message.answer === "" &&
      !message.thoughtLog &&
      !message.queryLog
    ) {
      nextMessages.splice(index, 1)
      break
    }
  }

  return nextMessages
}

export function findLatestAssistantMessage<TMessage extends { role: string }>(
  messages: TMessage[]
): Extract<TMessage, { role: "assistant" }> | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index]
    if (candidate.role === "assistant") {
      return candidate as Extract<TMessage, { role: "assistant" }>
    }
  }

  return null
}
