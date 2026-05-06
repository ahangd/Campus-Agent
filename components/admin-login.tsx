"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "登录失败。")
        return
      }

      window.location.reload()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "登录失败。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="surface-ring grid w-full gap-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="section-kicker">Knowledge Admin</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-[var(--text)]">校园知识维护后台</h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              统一维护 FAQ、规章制度和办事流程，减少手工改 Prompt 的成本，让校园咨询知识可以持续更新。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "常见问答", detail: "高频问题和标准答案" },
              { title: "规章制度", detail: "正式文本与来源部门" },
              { title: "办事流程", detail: "可供 Agent 调用的流程知识" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                <div className="text-sm font-medium text-[var(--text)]">{item.title}</div>
                <div className="mt-2 text-xs leading-6 text-[var(--text-muted)]">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--text)]">管理员登录</h2>
            <p className="text-sm text-[var(--text-muted)]">请输入后台口令进入知识维护工作台。</p>
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="admin-password" className="text-sm font-medium text-[var(--text)]">
              管理员口令
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
              placeholder="输入 ADMIN_PASSWORD"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <Button type="submit" className="mt-6 h-11 w-full rounded-lg" disabled={submitting || !password.trim()}>
            {submitting ? "正在验证..." : "进入后台"}
          </Button>
        </form>
      </section>
    </main>
  )
}
