"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, FilePenLine, X } from "lucide-react"

import DifyChatPanel from "@/components/dify-chat-panel"
import DifyEntryForm from "@/components/dify-entry-form"
import { Button } from "@/components/ui/button"
import { chatCopy } from "@/lib/chat-copy"
import { hasContextIdentity as hasRequiredIdentity, restoreStoredAgentContext as getStoredChatSession } from "@/lib/context-manager"

const setupSteps = [
  { step: "01", label: "进入聊天工作台" },
  { step: "02", label: "填写身份与变量" },
  { step: "03", label: "解锁正式对话" },
]

const editSteps = [
  { step: "01", label: "打开表单弹窗" },
  { step: "02", label: "修改身份与变量" },
  { step: "03", label: "继续当前对话" },
]

export default function ChatWorkspace({
  threadId,
  forceForm = false,
}: {
  threadId?: string
  forceForm?: boolean
}) {
  const [identityReady, setIdentityReady] = useState<boolean | null>(null)
  const [formOpen, setFormOpen] = useState<boolean>(forceForm)

  useEffect(() => {
    try {
      const session = getStoredChatSession()
      const ready = hasRequiredIdentity(session)
      setIdentityReady(ready)
      setFormOpen(forceForm || !ready)
    } catch {
      setIdentityReady(false)
      setFormOpen(true)
    }
  }, [forceForm])

  const isBlockingSetup = identityReady !== true

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-3 sm:px-5">
        <div className="mb-3 flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)]/92 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <div className="text-sm text-[var(--text-muted)]">智询 · CampusMind</div>
            <h1 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.03em]">聊天工作台</h1>
          </div>

          <div className="flex items-center gap-3">
            {identityReady ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)]"
                onClick={() => setFormOpen(true)}
              >
                <FilePenLine className="h-4 w-4" />
                编辑表单
              </Button>
            ) : null}

            <Button asChild variant="outline" className="rounded-full border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)]">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative flex-1">
          <div className={formOpen ? "pointer-events-none select-none blur-[3px]" : ""}>
            {identityReady ? (
              <DifyChatPanel copy={chatCopy} threadId={threadId} />
            ) : (
              <div className="surface-ring flex min-h-[640px] items-center justify-center rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-8">
                <div className="max-w-lg text-center">
                  <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium tracking-[0.12em] text-[var(--text-muted)]">
                    Chat Access
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">先完成身份表单，再开始对话</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    表单提交后，姓名、学号和变量会自动写入当前会话，用于后续查询、工具调用和提示词替换。
                  </p>
                </div>
              </div>
            )}
          </div>

          {formOpen ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(20,20,22,0.14)] px-4 py-6 backdrop-blur-md">
              <div className="surface-ring relative w-full max-w-[920px] overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)]">
                <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(47,107,255,0.08),rgba(47,107,255,0.02))] px-5 py-5 lg:border-b-0 lg:border-r">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[rgba(255,255,255,0.72)] px-3 py-1 text-xs font-medium tracking-[0.12em] text-[var(--accent)]">
                          {isBlockingSetup ? "进入工作台" : "更新表单"}
                        </div>
                        <h2 className="mt-3 text-[24px] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--text)]">
                          {isBlockingSetup ? "先填写变量表单。" : "随时修改上下文信息。"}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                          {isBlockingSetup
                            ? "完成姓名、学号和必要字段后，聊天区才会正式解锁。"
                            : "修改后的姓名、学号和变量会立即写回当前会话，后续对话会按新内容继续。"}
                        </p>
                      </div>

                      {isBlockingSetup ? (
                        <Button asChild variant="ghost" size="icon" className="rounded-full lg:hidden">
                          <Link href="/" aria-label="返回首页">
                            <X className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={() => setFormOpen(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="mt-6 grid gap-2.5">
                      {(isBlockingSetup ? setupSteps : editSteps).map((item) => (
                        <div key={item.step} className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.76)] px-3.5 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.step}</div>
                          <div className="mt-1 text-sm font-medium text-[var(--text)]">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative p-2.5">
                    {isBlockingSetup ? (
                      <Button asChild variant="ghost" size="icon" className="absolute right-4 top-4 hidden rounded-full lg:inline-flex">
                        <Link href="/" aria-label="返回首页">
                          <X className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 hidden rounded-full lg:inline-flex"
                        onClick={() => setFormOpen(false)}
                        aria-label="关闭表单"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    <DifyEntryForm
                      title={isBlockingSetup ? "先填写变量表单，再开始对话" : "修改变量表单"}
                      description={
                        isBlockingSetup
                          ? "进入聊天前必须完成表单中的姓名和学号。提交后，表单内容会自动写入会话，并替换提示词中的对应变量。"
                          : "你可以在这里更新姓名、学号和其他变量。保存后，当前对话会使用新的上下文继续。"
                      }
                      submitLabel={isBlockingSetup ? "开始对话" : "保存修改"}
                      cardClassName="w-full"
                      onSuccess={() => {
                        setIdentityReady(true)
                        setFormOpen(false)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
