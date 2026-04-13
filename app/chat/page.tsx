"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DifyChatPanel from "@/components/dify-chat-panel"
import { Button } from "@/components/ui/button"

const chatCopy = {
  capabilities: "当前能力",
  capabilitiesValue: "多轮对话、上下文理解、可扩展校园知识库",
  history: "查看记录",
  newSession: "新建会话",
  chatWindow: "对话窗口",
  chatTitle: "校园业务咨询",
  online: "在线",
  placeholder: "请输入你的问题，例如：如何查询课程安排？",
  send: "发送",
  userRoleLabel: "我",
  agentRoleLabel: "校园助手",
  welcomeUser: "你好，我想咨询校园业务。",
  welcomeAgent: "你好，我是校园助手。你可以问我课程安排、图书馆信息、校园卡使用、报修流程等问题。",
  thinkingProcess: "思考过程",
  queryResults: "查询结果",
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">校园智能咨询助手</div>
            <h1 className="mt-1 text-3xl font-semibold">对话页面</h1>
          </div>
          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white hover:bg-slate-100">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>
        </div>

        <DifyChatPanel copy={chatCopy} />
      </div>
    </main>
  )
}
