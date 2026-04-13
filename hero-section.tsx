"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import DifyEntryModal from "@/components/dify-entry-modal"
import { BookOpen, CreditCard, GraduationCap, Wrench } from "lucide-react"

const text = {
  subtitle: "校园智能咨询助手",
  startChat: "开始咨询",
  panelTitle: "校园咨询功能界面",
  panelDescription: "支持课程安排、图书馆信息、校园卡使用、报修流程和规章制度等校园问题咨询。",
  quickActions: "快捷提问",
  capabilities: "当前能力",
  capabilitiesValue: "多轮对话、上下文理解、可扩展校园知识库",
  history: "查看记录",
  newSession: "新建会话",
}

const quickActions = ["课程安排", "图书馆信息", "校园卡使用", "报修流程", "规章制度", "办事指南"]

const serviceItems = [
  { icon: <GraduationCap className="h-4 w-4" />, label: "课程安排" },
  { icon: <BookOpen className="h-4 w-4" />, label: "图书馆信息" },
  { icon: <CreditCard className="h-4 w-4" />, label: "校园卡使用" },
  { icon: <Wrench className="h-4 w-4" />, label: "报修流程" },
]

const FORM_STORAGE_KEY = "dify-ev-user-input-form"
const CHAT_STORAGE_KEY = "dify-ev-chat-session"
const PENDING_QUERY_STORAGE_KEY = "dify-ev-pending-query"

type ChatSession = {
  formValues?: Record<string, unknown>
}

function firstNonEmptyString(values: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = values[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

export default function HeroSection() {
  const router = useRouter()
  const [quickActionError, setQuickActionError] = useState("")

  const handleQuickAction = (query: string) => {
    try {
      // 草稿（实时输入）优先，避免用户已清空表单但仍读取到旧提交数据。
      const draftRaw = window.localStorage.getItem(FORM_STORAGE_KEY)
      const draftValues = draftRaw ? (JSON.parse(draftRaw) as Record<string, unknown>) : {}

      // 这是上一次点击“开始对话”时保存的稳定快照。
      const chatRaw = window.localStorage.getItem(CHAT_STORAGE_KEY)
      const chatParsed = chatRaw ? (JSON.parse(chatRaw) as ChatSession) : null
      const chatValues = chatParsed?.formValues && typeof chatParsed.formValues === "object" ? chatParsed.formValues : {}

      // Prefer current form draft; fallback to last submitted values.
      const values = { ...chatValues, ...(draftValues && typeof draftValues === "object" ? draftValues : {}) }

      const studentId = firstNonEmptyString(values, ["student_id", "studentId", "student_no", "学号"])
      const name = firstNonEmptyString(values, ["name", "student_name", "real_name", "姓名"])

      if (!studentId || !name) {
        setQuickActionError("请先填写学号和姓名，再使用快捷提问。")
        // 新手更容易理解的交互：自动滚动到表单区域，告诉用户下一步该做什么。
        document.getElementById("research-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }

      setQuickActionError("")
      // 不直接在首页发请求：先把问题暂存，进入聊天页后自动发送。
      window.localStorage.setItem(PENDING_QUERY_STORAGE_KEY, query)
      router.push("/chat")
    } catch {
      setQuickActionError("无法读取表单信息，请先重新填写学号和姓名。")
      document.getElementById("research-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 lg:px-6">
        {/* 控件：顶部导航栏。作用：展示系统标题，并提供“开始咨询”按钮快速滚动到表单区域。 */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-lg font-semibold">Campus Agent</div>
            <div className="text-sm text-slate-500">{text.subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => document.getElementById("research-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {text.startChat}
            </Button>
          </div>
        </header>

        {/* 控件：页面主体双栏布局。作用：左侧是快捷入口，右侧是能力展示 + 调研表单。 */}
        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* 控件：左侧功能栏。作用：展示常见咨询项与快捷提问按钮。 */}
          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-5">
              <h1 className="text-2xl font-semibold tracking-tight">{text.panelTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text.panelDescription}</p>
            </div>

            <div className="space-y-3">
              {serviceItems.map((item) => (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="text-slate-500">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">{text.quickActions}</div>
              {quickActionError ? <p className="mt-2 text-xs text-rose-600">{quickActionError}</p> : null}
              {/* 控件：快捷提问按钮组。作用：已填写学号/姓名时跳转聊天并自动发送该问题。 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {quickActions.map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
                    onClick={() => handleQuickAction(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid min-h-0 gap-6 lg:grid-rows-[auto_1fr]">
            {/* 控件：能力信息卡片。作用：告诉用户当前系统能力，不参与交互。 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm text-slate-500">{text.capabilities}</div>
                  <div className="mt-1 text-xl font-semibold">{text.capabilitiesValue}</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-full border-slate-300 bg-white hover:bg-slate-50" type="button" disabled>
                    {text.history}
                  </Button>
                  <Button variant="outline" className="rounded-full border-slate-300 bg-white hover:bg-slate-50" type="button" disabled>
                    {text.newSession}
                  </Button>
                </div>
              </div>
            </div>

            {/* 控件：调研表单容器。作用：承载 DifyEntryModal 动态表单组件。 */}
            <div className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-5">
              <div id="research-form" className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">调研表单</div>
                </div>
                <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">在线</div>
              </div>
              <DifyEntryModal />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
