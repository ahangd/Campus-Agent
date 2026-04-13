"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseDifySseDataLines } from "@/lib/parse-dify-sse"

/**
 * 这一组类型是“界面文案配置”。
 * 你在 chat/page.tsx 里传入 copy 后，这里统一读取显示，方便后续做多语言或改文案。
 */
export type DifyChatPanelCopy = {
  capabilities: string
  capabilitiesValue: string
  history: string
  newSession: string
  chatWindow: string
  chatTitle: string
  online: string
  placeholder: string
  send: string
  userRoleLabel: string
  agentRoleLabel: string
  welcomeUser: string
  welcomeAgent: string
  thinkingProcess: string
  queryResults: string
}

type UserChatMessage = { role: "user"; content: string }
type AssistantChatMessage = {
  role: "assistant"
  /** 模型最终回复（message / agent_message 流式片段拼接） */
  answer: string
  /** 思考与工具调用说明，不含知识库/工具原始 observation */
  thoughtLog: string
  /** 检索、工具返回等「查询结果」，单独展示在思考区之外 */
  queryLog: string
  /** 思考过程展示是否展开（流结束后自动折叠） */
  thoughtOpen: boolean
}

/**
 * 一条聊天消息要么是“用户消息”，要么是“助手消息”。
 * UI 渲染时会根据 role 判断显示在左边还是右边、显示哪种样式。
 */
type ChatMessage = UserChatMessage | AssistantChatMessage

function isAssistantMessage(m: ChatMessage): m is AssistantChatMessage {
  return m.role === "assistant"
}

type DifySsePayload = {
  event?: string
  answer?: string
  conversation_id?: string
  message?: string
  code?: string
  thought?: string
  observation?: string
  tool?: string
  tool_input?: string | Record<string, unknown>
}

/**
 * Dify 可能在回答里带 <think>...</think>（内部思考）。
 * 这个函数专门清理这些标签，确保用户只看到最终可读答案。
 */
function sanitizeAssistantAnswer(raw: string) {
  // 过滤模型思考标签，避免把内部推理直接展示给用户。
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "")
  text = text.replace(/<\/?think>/gi, "")
  const danglingOpenTagIndex = text.toLowerCase().lastIndexOf("<think>")
  if (danglingOpenTagIndex >= 0) {
    text = text.slice(0, danglingOpenTagIndex)
  }
  return text.trim()
}

const CHAT_STORAGE_KEY = "dify-ev-chat-session"
const PENDING_QUERY_STORAGE_KEY = "dify-ev-pending-query"
const CHAT_HISTORY_STORAGE_KEY = "dify-ev-chat-history"

type ChatSession = {
  formValues?: Record<string, unknown>
}

type StoredHistoryItem = {
  id: string
  title: string
  updatedAt: number
  conversationId: string | null
  messages: ChatMessage[]
}

/**
 * 每个本地会话给一个唯一 id。
 * 作用：保存历史时可以“更新同一个会话”，而不是每次都新增一条。
 */
function createLocalSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`
}

/**
 * 从 localStorage 读取历史记录。
 * 这里做了 try/catch，防止本地缓存被污染时页面崩溃。
 */
function getHistoryItems() {
  if (typeof window === "undefined") return [] as StoredHistoryItem[]
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredHistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 把历史记录写回 localStorage。
 */
function saveHistoryItems(items: StoredHistoryItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(items))
}

/**
 * 生成/读取当前浏览器用户 id（本地持久化）。
 * 这个 id 会随请求发给后端，Dify 用它区分不同终端用户。
 */
function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "web-user"
  const key = "dify-chat-user-id"
  let id = window.localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
  }
  return id
}

/**
 * 读取“表单已提交快照”作为聊天 inputs。
 * 例如 student_id、name 这类字段，会在每次聊天请求里一并发送给 Dify。
 */
function getStoredInputs(): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ChatSession
    if (!parsed || typeof parsed !== "object") return {}
    const inputs = parsed.formValues
    return inputs && typeof inputs === "object" ? inputs : {}
  } catch {
    return {}
  }
}

export default function DifyChatPanel({ copy }: { copy: DifyChatPanelCopy }) {
  // inputId 用于关联 <label htmlFor> 和输入框，提升可访问性。
  const inputId = useId()

  // messages 是聊天窗口唯一数据源：所有气泡都从这里渲染。
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "user", content: copy.welcomeUser },
    { role: "assistant", answer: copy.welcomeAgent, thoughtLog: "", queryLog: "", thoughtOpen: false },
  ])
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [localSessionId, setLocalSessionId] = useState(createLocalSessionId)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<StoredHistoryItem[]>([])

  // streaming=true 表示“正在等待/接收模型流式输出”，此时会禁用发送按钮避免重复提交。
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // abortRef 保存当前请求控制器，可用于“中断本次流式请求”。
  const abortRef = useRef<AbortController | null>(null)

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const newSession = useCallback(() => {
    // 新会话会清空当前上下文并生成新的本地会话 id（用于历史记录分组）。
    stopStream()
    setConversationId(null)
    setLocalSessionId(createLocalSessionId())
    setError(null)
    setStreaming(false)
    setMessages([
      { role: "user", content: copy.welcomeUser },
      { role: "assistant", answer: copy.welcomeAgent, thoughtLog: "", queryLog: "", thoughtOpen: false },
    ])
  }, [copy.welcomeAgent, copy.welcomeUser, stopStream])

  const persistCurrentSession = useCallback(
    (nextMessages: ChatMessage[], nextConversationId: string | null) => {
      // 欢迎语不计入“有效会话”，避免历史记录里出现空白条目。
      const meaningfulMessages = nextMessages.filter(
        (m) => !(m.role === "assistant" && m.answer === copy.welcomeAgent && !m.thoughtLog && !m.queryLog)
      )
      if (meaningfulMessages.length <= 1) return

      const userFirst = meaningfulMessages.find((m) => m.role === "user")
      const title = userFirst?.content?.trim() || "未命名会话"
      const item: StoredHistoryItem = {
        id: localSessionId,
        title: title.length > 24 ? `${title.slice(0, 24)}...` : title,
        updatedAt: Date.now(),
        conversationId: nextConversationId,
        messages: nextMessages,
      }
      const prev = getHistoryItems().filter((i) => i.id !== localSessionId)
      // 只保留最近 30 条，防止 localStorage 无限增长。
      const next = [item, ...prev].slice(0, 30)
      saveHistoryItems(next)
      setHistoryItems(next)
    },
    [copy.welcomeAgent, localSessionId]
  )

  const sendQuery = useCallback(async (rawQuery: string) => {
    // 1) 基础校验：空消息不发；流式进行中不允许重复发。
    const query = rawQuery.trim()
    if (!query || streaming) return

    // 2) 进入“发送中”状态，清理旧错误。
    setError(null)
    if (rawQuery === input) {
      setInput("")
    }
    setStreaming(true)

    // 先把用户消息和“空助手消息”放进列表，后续流式片段会不断补全助手回答。
    const userMsg: ChatMessage = { role: "user", content: query }
    setMessages((prev) => [...prev, userMsg, { role: "assistant", answer: "", thoughtLog: "", queryLog: "", thoughtOpen: false }])

    const controller = new AbortController()
    abortRef.current = controller

    let buffer = ""
    let assistantBuffer = ""

    try {
      // 3) 发请求到你自己的后端代理（而不是直接请求 Dify）。
      const res = await fetch("/api/dify/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          conversationId,
          inputs: getStoredInputs(),
          user: getOrCreateUserId(),
        }),
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `请求失败 (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("无法读取响应流")

      const decoder = new TextDecoder()

      // 4) 持续读取后端返回的 SSE 流。
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue

          const payloads = parseDifySseDataLines(trimmed) as DifySsePayload[]
          for (const data of payloads) {
            if (!data || typeof data !== "object") continue
            if (data.event === "ping") continue

            if (
              (data.event === "message" || data.event === "agent_message") &&
              typeof data.answer === "string"
            ) {
              // Dify 会分片返回答案：这里做拼接并实时刷新最后一条助手消息。
              assistantBuffer += data.answer
              const text = sanitizeAssistantAnswer(assistantBuffer)
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (isAssistantMessage(last)) {
                  next[next.length - 1] = { ...last, answer: text }
                }
                return next
              })
            }

            if (data.event === "agent_thought") {
              // thought / tool / observation 单独记录，前端可折叠展示。
              const thought = typeof data.thought === "string" ? data.thought.trim() : ""
              const tool = typeof data.tool === "string" ? data.tool.trim() : ""
              const rawToolInput = data.tool_input
              const toolInput =
                typeof rawToolInput === "string"
                  ? rawToolInput.trim()
                  : rawToolInput !== undefined
                    ? JSON.stringify(rawToolInput)
                    : ""
              const observation = typeof data.observation === "string" ? data.observation.trim() : ""

              const thoughtLines: string[] = []
              if (thought) thoughtLines.push(thought)
              if (tool) thoughtLines.push(`工具: ${tool}`)
              if (toolInput) thoughtLines.push(`输入: ${toolInput}`)
              const thoughtBlock = thoughtLines.join("\n")

              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (!isAssistantMessage(last)) return next

                let thoughtLog = last.thoughtLog
                if (thoughtBlock) {
                  thoughtLog = thoughtLog.includes(thoughtBlock) ? thoughtLog : thoughtLog ? `${thoughtLog}\n\n---\n\n${thoughtBlock}` : thoughtBlock
                }

                let queryLog = last.queryLog
                if (observation) {
                  queryLog = queryLog.includes(observation) ? queryLog : queryLog ? `${queryLog}\n\n${observation}` : observation
                }

                next[next.length - 1] = { ...last, thoughtLog, queryLog, thoughtOpen: Boolean(thoughtLog) }
                return next
              })
            }

            if (typeof data.conversation_id === "string" && data.conversation_id) {
              // 保存会话 id，下一次提问会带上，实现多轮上下文。
              setConversationId(data.conversation_id)
            }

            if (data.event === "error") {
              throw new Error(data.message || data.code || "Dify 返回错误事件")
            }

            if (data.event === "message_end") {
              // 回答结束后，自动把“思考过程”折叠起来，界面更干净。
              if (typeof data.conversation_id === "string" && data.conversation_id) {
                setConversationId(data.conversation_id)
              }
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (isAssistantMessage(last)) {
                  next[next.length - 1] = { ...last, thoughtOpen: false }
                }
                return next
              })
            }
          }
        }
      }
    } catch (e) {
      // AbortError 是主动中断，不算真正错误，这里直接 return。
      if ((e as Error).name === "AbortError") return
      const msg = e instanceof Error ? e.message : "发送失败"
      setError(msg)
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (isAssistantMessage(last) && last.answer === "" && !last.thoughtLog && !last.queryLog) next.pop()
        return next
      })
    } finally {
      // 无论成功失败都执行：收尾状态，避免按钮一直处于 loading。
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (isAssistantMessage(last)) {
          next[next.length - 1] = { ...last, thoughtOpen: false }
        }
        return next
      })
      setStreaming(false)
      abortRef.current = null
    }
  }, [conversationId, input, persistCurrentSession, streaming])

  const send = useCallback(async () => {
    // 输入框发送入口：复用 sendQuery，避免维护两套发送逻辑。
    await sendQuery(input)
  }, [input, sendQuery])

  useEffect(() => {
    // 页面第一次加载时，把历史记录读进内存 state。
    setHistoryItems(getHistoryItems())
  }, [])

  useEffect(() => {
    try {
      // 处理“首页快捷提问”传过来的待发送问题：进入聊天页后自动发一次。
      const pending = window.localStorage.getItem(PENDING_QUERY_STORAGE_KEY)
      if (!pending || !pending.trim()) return
      window.localStorage.removeItem(PENDING_QUERY_STORAGE_KEY)
      void sendQuery(pending)
    } catch {
      // ignore pending query parse/read errors
    }
  }, [sendQuery])

  useEffect(() => {
    if (streaming) return
    // 每轮消息稳定后落盘历史记录。
    persistCurrentSession(messages, conversationId)
  }, [conversationId, messages, persistCurrentSession, streaming])

  return (
    <>
      {/* 控件：会话工具栏。作用：查看历史记录、新建会话。 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">{copy.capabilities}</div>
            <div className="mt-1 text-xl font-semibold">{copy.capabilitiesValue}</div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full border-slate-300 bg-white hover:bg-slate-50"
              type="button"
              onClick={() => setHistoryOpen(true)}
            >
              {copy.history}
            </Button>
            <Button
              type="button"
              className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={newSession}
              disabled={streaming}
            >
              {copy.newSession}
            </Button>
          </div>
        </div>
      </div>

      {historyOpen ? (
        /* 控件：历史记录弹层。作用：查看并恢复之前保存的会话。 */
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">历史对话记录</h3>
              <Button type="button" variant="outline" onClick={() => setHistoryOpen(false)}>
                关闭
              </Button>
            </div>
            {historyItems.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">暂无历史对话记录</div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => {
                      // 点击某条历史：把那次会话的消息和 conversationId 回填到当前聊天窗口。
                      setMessages(item.messages)
                      setConversationId(item.conversationId)
                      setLocalSessionId(item.id)
                      setHistoryOpen(false)
                      setError(null)
                    }}
                  >
                    <div className="text-sm font-medium text-slate-800">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 控件：聊天消息窗口。作用：显示用户消息、助手思考区和最终回答。 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">{copy.chatWindow}</div>
            <div className="text-base font-medium">{copy.chatTitle}</div>
          </div>
          <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">{copy.online}</div>
        </div>

        {error ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={`${idx}-${message.role}-${isAssistantMessage(message) ? message.answer.slice(0, 24) : message.content.slice(0, 24)}`}
              className={message.role === "assistant" ? "flex" : "flex justify-end"}
            >
              <div
                className={
                  message.role === "assistant"
                    ? "max-w-2xl rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-7 text-slate-700"
                    : "max-w-xl rounded-2xl bg-slate-900 px-4 py-3 text-sm leading-7 text-white"
                }
              >
                <div className={message.role === "assistant" ? "mb-1 text-xs text-slate-400" : "mb-1 text-xs text-slate-300"}>
                  {message.role === "assistant" ? copy.agentRoleLabel : copy.userRoleLabel}
                </div>
                {isAssistantMessage(message) ? (
                  <div>
                    {/* 控件：思考过程折叠区。作用：展示模型过程信息，可手动展开/收起。 */}
                    {message.thoughtLog ? (
                      <details className="mb-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-xs open:shadow-sm">
                        <summary className="cursor-pointer select-none font-medium text-slate-600">{copy.thinkingProcess}</summary>
                        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-slate-600">{message.thoughtLog}</pre>
                      </details>
                    ) : null}
                    <div className="whitespace-pre-wrap">
                      {message.answer || (streaming && idx === messages.length - 1 ? "…" : "")}
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 控件：消息输入区。作用：输入问题并发送到后端聊天接口。 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label htmlFor={inputId} className="sr-only">
            {copy.placeholder}
          </label>
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-slate-700 focus-within:ring-2 focus-within:ring-slate-200">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              id={inputId}
              className="min-h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={copy.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              disabled={streaming}
            />
          </div>
          <Button
            type="button"
            className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800"
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
          >
            {copy.send}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
