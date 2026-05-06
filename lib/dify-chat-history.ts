import type { ChatCopy } from "@/lib/chat-copy"

export type HistoryGroupKey = "today" | "week" | "earlier"

type HistoryMessage = {
  role: "user" | "assistant"
  content?: string
}

export type StoredHistoryItem<TMessage = HistoryMessage> = {
  id: string
  title: string
  updatedAt: number
  conversationId: string | null
  messages: TMessage[]
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function isUserMessage<TMessage extends HistoryMessage>(message: TMessage): message is TMessage & { role: "user"; content: string } {
  return message.role === "user" && typeof message.content === "string"
}

export function classifyHistoryTime(timestamp: number): HistoryGroupKey {
  const now = new Date()
  const target = new Date(timestamp)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diff = startOfToday.getTime() - targetDay.getTime()

  if (diff <= 0) return "today"
  if (diff < 7 * DAY_IN_MS) return "week"
  return "earlier"
}

export function getHistoryGroupLabel(group: HistoryGroupKey, copy: ChatCopy) {
  if (group === "today") return copy.today
  if (group === "week") return copy.thisWeek
  return copy.earlier
}

export function createHistoryTitle<TMessage extends HistoryMessage>(messages: TMessage[], welcomeUser: string) {
  const firstRealUserMessage = messages.find(
    (message): message is TMessage & { role: "user"; content: string } => isUserMessage(message) && message.content.trim() !== welcomeUser.trim()
  )

  const title = firstRealUserMessage?.content.trim() || "\u672a\u547d\u540d\u4f1a\u8bdd"
  return title.length > 24 ? `${title.slice(0, 24)}...` : title
}

export function buildNextHistoryItems<TMessage>(
  currentSessionId: string,
  item: StoredHistoryItem<TMessage>,
  historyItems: StoredHistoryItem<TMessage>[],
  maxItems: number
) {
  return [item, ...historyItems.filter((history) => history.id !== currentSessionId)].slice(0, maxItems)
}

export function removeHistoryItemsById<TMessage>(targetId: string, historyItems: StoredHistoryItem<TMessage>[]) {
  return historyItems.filter((item) => item.id !== targetId)
}

export function groupHistoryItems<TMessage>(items: StoredHistoryItem<TMessage>[]) {
  const groups: Record<HistoryGroupKey, StoredHistoryItem<TMessage>[]> = {
    today: [],
    week: [],
    earlier: [],
  }

  items.forEach((item) => {
    groups[classifyHistoryTime(item.updatedAt)].push(item)
  })

  return groups
}
