"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { Check, Copy, FileCode2, FileSearch, Gauge, Grip, ListTree, PanelRightClose, Pin, PinOff } from "lucide-react"

import { buildInspectorMarkdown, getReflectionItems, splitInspectorBlocks } from "@/lib/agent-inspector"
import { sanitizeInspectorText } from "@/lib/dify-chat-message"
import { resolveInspectorTab } from "@/lib/agent-inspector-state"
import { copyTextToClipboard } from "@/lib/clipboard"
import { formatObservationBlock } from "@/lib/dify-observation"
import { Button } from "./ui/button"

export type InspectorTab = "plan" | "evidence" | "tools" | "reflection"

export type ToolEvent = {
  name: string
  input: string
  result: string
  duration: number | null
}

export type Reflection = {
  groundedness: number
  completeness: number
  correctness: number
  tone: number
  safety: number
  advice: string
}

export interface AgentInspectorProps {
  thoughtLog?: string
  queryLog?: string
  toolEvents?: ToolEvent[]
  reflection?: Reflection
  totalDuration?: number
  isOpen: boolean
  onToggle: () => void
  defaultTab?: InspectorTab
}

const tabs = [
  { key: "plan" as const, label: "规划", icon: ListTree },
  { key: "evidence" as const, label: "证据", icon: FileSearch },
  { key: "tools" as const, label: "工具", icon: Grip },
  { key: "reflection" as const, label: "反思", icon: Gauge },
]

const COPY_FEEDBACK_DURATION_MS = 2000

function EmptyStateCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
      {children}
    </div>
  )
}

function BulletText({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm leading-7 text-[var(--text-muted)]">
      {content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{line}</span>
          </div>
        ))}
    </div>
  )
}

function PlanPanel({ thoughtBlocks }: { thoughtBlocks: string[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">规划步骤</div>
        <div className="mt-3 space-y-3">
          {thoughtBlocks.length > 0 ? (
            thoughtBlocks.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    {index + 1}
                  </span>
                  规划步骤
                </div>
                <BulletText content={item} />
              </div>
            ))
          ) : (
            <EmptyStateCard>当前轮次还没有显式规划信息。</EmptyStateCard>
          )}
        </div>
      </div>

      <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">使用说明</div>
        <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
          <p>点击消息中的证据卡片，右侧会自动切换到“证据”标签页。</p>
          <p>右上角支持把当前 Inspector 内容复制成 Markdown，便于记录与展示。</p>
        </div>
      </div>
    </div>
  )
}

function EvidencePanel({ evidenceBlocks }: { evidenceBlocks: string[] }) {
  if (evidenceBlocks.length === 0) {
    return <EmptyStateCard>当前轮次还没有可显示的检索结果。</EmptyStateCard>
  }

  return (
    <div className="space-y-3">
      {evidenceBlocks.map((item, index) => {
        const formatted = formatObservationBlock(item)
        const content = formatted.formatted.replace(/^工具:.*?\n结果:\n/s, "")

        return (
          <div key={`${item}-${index}`} className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{`证据 ${index + 1}`}</span>
              {formatted.toolName ? (
                <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                  {formatted.toolName}
                </span>
              ) : (
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">支持追溯</span>
              )}
            </div>
            <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--text-muted)]">
              {content}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ToolsPanel({ toolEvents }: { toolEvents: ToolEvent[] }) {
  if (toolEvents.length === 0) {
    return <EmptyStateCard>本轮对话没有触发独立的工具调用。</EmptyStateCard>
  }

  return (
    <div className="space-y-3">
      {toolEvents.map((tool, index) => (
        <div key={`${tool.name}-${index}`} className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{tool.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">工具调用</div>
            </div>
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
              {typeof tool.duration === "number" ? `${tool.duration}ms` : "-- ms"}
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <FileCode2 className="h-3.5 w-3.5" />
                args
              </div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-[12px] bg-[color:var(--surface-2)] px-3 py-2 font-mono text-xs leading-6 text-[var(--text-muted)]">
                {tool.input}
              </pre>
            </div>

            <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <Copy className="h-3.5 w-3.5" />
                result
              </div>
              <div className="rounded-[12px] bg-[color:var(--surface-2)] px-3 py-2 text-sm leading-7 text-[var(--text-muted)]">
                {tool.result}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReflectionPanel({ reflection }: { reflection?: Reflection }) {
  if (!reflection) {
    return null
  }

  const reflectionItems = getReflectionItems(reflection)

  return (
    <div className="space-y-3">
      {reflectionItems.map(({ key, label, score }) => (
        <div key={key} className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--text)]">{label}</span>
            <span className="text-[var(--text-muted)]">{score}/5</span>
          </div>
          <div className="h-2 rounded-full bg-[color:var(--surface)]">
            <div className="h-2 rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${(score / 5) * 100}%` }} />
          </div>
        </div>
      ))}

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-muted)]">
        <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">改进建议</div>
        {reflection.advice}
      </div>
    </div>
  )
}

export default function AgentInspector({
  thoughtLog = "",
  queryLog = "",
  toolEvents = [],
  reflection,
  totalDuration,
  isOpen,
  onToggle,
  defaultTab = "plan",
}: AgentInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>(defaultTab)
  const [isPinned, setIsPinned] = useState(false)
  const [copied, setCopied] = useState(false)

  const thoughtBlocks = splitInspectorBlocks(sanitizeInspectorText(thoughtLog))
  const evidenceBlocks = splitInspectorBlocks(queryLog)
  const hasData = Boolean(thoughtLog || queryLog || toolEvents.length > 0 || reflection)

  const handleCopy = useCallback(async () => {
    const markdown = buildInspectorMarkdown({ thoughtBlocks, evidenceBlocks, toolEvents, reflection, totalDuration })
    const copiedOk = await copyTextToClipboard(markdown)
    if (!copiedOk) return

    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS)
  }, [evidenceBlocks, reflection, thoughtBlocks, toolEvents, totalDuration])

  useEffect(() => {
    setActiveTab((currentTab) => resolveInspectorTab({ currentTab, requestedTab: defaultTab, pinned: isPinned }))
  }, [defaultTab, isPinned])

  return (
    <aside
      className={`surface-ring min-h-[720px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] transition-all duration-300 ${
        isOpen ? "flex" : "hidden"
      } ${isPinned ? "xl:sticky xl:top-4 xl:max-h-[calc(100vh-32px)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-5">
        <div>
          <div className="text-sm text-[var(--text-muted)]">Agent Inspector</div>
          <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">实时展示 Agent 的规划、证据、工具调用和质量反思。</p>
          {typeof totalDuration === "number" ? (
            <div className="mt-2 text-xs text-[var(--text-muted)]">
              总耗时 <span className="font-medium text-[var(--text)]">{totalDuration}ms</span>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${isPinned ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""}`}
            onClick={() => setIsPinned((value) => !value)}
            title={isPinned ? "取消固定当前标签页" : "固定当前标签页"}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onToggle} title="收起面板">
            <PanelRightClose className="h-4 w-4" />
          </Button>
          {hasData ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleCopy} title="复制为 Markdown">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-5 pt-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
              activeTab === key
                ? "border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[var(--text-muted)]"
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="chat-scroll flex-1 overflow-y-auto p-5">
        {!hasData ? (
          <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-5 text-sm leading-7 text-[var(--text-muted)]">
            本轮对话还没有触发足够的分析数据，发送一条消息后这里会逐步补全。
          </div>
        ) : null}

        {hasData && activeTab === "plan" ? <PlanPanel thoughtBlocks={thoughtBlocks} /> : null}
        {hasData && activeTab === "evidence" ? <EvidencePanel evidenceBlocks={evidenceBlocks} /> : null}
        {hasData && activeTab === "tools" ? <ToolsPanel toolEvents={toolEvents} /> : null}
        {hasData && activeTab === "reflection" ? <ReflectionPanel reflection={reflection} /> : null}
      </div>
    </aside>
  )
}
