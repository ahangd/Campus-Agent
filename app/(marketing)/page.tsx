"use client"

import Link from "next/link"
import { AnimatePresence, motion, useScroll } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentType, ReactNode, WheelEvent } from "react"
import {
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck2,
  PanelRightOpen,
  Sparkles,
  TimerReset,
  X,
} from "lucide-react"

import {
  accessFields,
  accessHighlights,
  accessSteps,
  compareEvidence,
  footerGroups,
  heroQueries,
  heroReplies,
  navItems,
  sectionHeadingStyle,
  storySections,
  toolGraphStats,
  toolIconMap,
  tools,
  trustItems,
  workflowItems,
  workflowStats,
} from "@/lib/marketing-content"

function ToolChip({ tool }: { tool: string }) {
  const Icon = toolIconMap[tool] ?? Sparkles

  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]">
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      {tool}
    </div>
  )
}

function MarqueeRow({
  items,
  direction = "left",
  duration = 28,
}: {
  items: string[]
  direction?: "left" | "right"
  duration?: number
}) {
  const duplicated = [...items, ...items]

  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(90deg,var(--surface),rgba(255,255,255,0))] sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(270deg,var(--surface),rgba(255,255,255,0))] sm:w-16" />
      <div
        className={`flex w-max gap-3 group-hover:[animation-play-state:paused] ${
          direction === "left" ? "animate-[marquee-left_28s_linear_infinite]" : "animate-[marquee-right_28s_linear_infinite]"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {duplicated.map((tool, index) => (
          <ToolChip key={`${direction}-${tool}-${index}`} tool={tool} />
        ))}
      </div>
    </div>
  )
}

function SectionShowcase({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,246,250,0.92))] p-4 shadow-[0_18px_46px_rgba(20,20,22,0.06)] sm:p-5">
      <div className="mb-4 rounded-[24px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.88)] px-4 py-3.5">
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]">{label}</div>
        <div className="mt-1 text-[17px] font-semibold text-[var(--text)]">{title}</div>
      </div>
      {children}
    </div>
  )
}

function TrustPreviewCard({
  icon: Icon,
  title,
  description,
  value,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
  value: string
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div>
            <div className="text-[17px] font-semibold leading-7 text-[var(--text)]">{title}</div>
            <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
          {value}
        </span>
      </div>
    </div>
  )
}

function StorySection({
  eyebrow,
  label,
  title,
  description,
  active,
  onSelect,
}: {
  eyebrow: string
  label: string
  title: string
  description: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-screen w-full flex-col justify-center border-b border-[color:var(--border)] py-20 text-left transition ${
        active ? "opacity-100" : "opacity-60 hover:opacity-90"
      }`}
    >
      <div className="mb-5 text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">{eyebrow}</div>
      <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <h2
        className="max-w-[9ch] whitespace-pre-line text-balance text-[clamp(32px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text)]"
        style={sectionHeadingStyle}
      >
        {title}
      </h2>
      <p className="mt-6 max-w-[24ch] text-[17px] leading-8 text-[var(--text-muted)]">{description}</p>
    </button>
  )
}

function HeroScene({ query, reply }: { query: string; reply: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] border border-[rgba(47,107,255,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,247,250,0.92))] p-5 shadow-[0_30px_80px_rgba(20,20,22,0.08)]">
      <div className="absolute inset-x-12 top-14 h-40 rounded-full bg-[rgba(47,107,255,0.06)] blur-3xl" />
      <div className="relative rounded-[28px] border border-[color:var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Bot className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-[17px] font-semibold">智询 CampusMind</div>
              <div className="text-sm text-[var(--text-muted)]">正在处理你的校园问题</div>
            </div>
          </div>
          <span className="rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
            Agent 在线
          </span>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="max-w-[78%] rounded-[22px] bg-[var(--accent)] px-5 py-3.5 text-[17px] leading-7 text-white shadow-[0_10px_24px_rgba(47,107,255,0.18)]">
            {query}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
            <Compass className="h-4.5 w-4.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1 rounded-[24px] bg-[var(--surface-2)] p-5">
            <div className="text-[17px] leading-8 text-[var(--text)]">{reply}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["规划", "检索", "调用课表 API", "回答"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[rgba(255,255,255,0.94)] px-3.5 py-1.5 text-xs text-[var(--text-muted)]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[20px] border border-[color:var(--border)] bg-[rgba(250,250,249,0.78)] px-5 py-3.5 text-[15px] text-[var(--text-muted)]">
          继续输入问题，或者直接进入你的办事流程。
        </div>
      </div>
    </div>
  )
}

function WorkflowScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,246,250,0.92))] p-5 shadow-[0_30px_80px_rgba(20,20,22,0.08)]">
      <div className="absolute inset-x-10 top-12 h-40 rounded-full bg-[rgba(47,107,255,0.05)] blur-3xl" />
      <div className="relative grid gap-4">
        {workflowItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="rounded-[28px] border border-[color:var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[17px] font-semibold text-[var(--text)]">{item.title}</div>
                <div className="mt-3 max-w-[28ch] text-sm leading-7 text-[var(--text-muted)]">{item.body}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.accent}`}>步骤 {index + 1}</span>
            </div>
          </motion.div>
        ))}

        <div className="grid gap-4 md:grid-cols-3">
          {workflowStats.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.88)] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.label}</div>
              <div className="mt-3 text-base font-medium text-[var(--text)]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompareScene() {
  return (
    <div className="h-full w-full overflow-hidden rounded-[34px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,250,0.92))] p-5 shadow-[0_30px_80px_rgba(20,20,22,0.08)]">
      <div className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-muted)]">
        问题: 帮我看一下这周计算机学院的公共课安排。
      </div>

      <div className="mt-6 grid h-[calc(100%-56px)] gap-5 lg:grid-cols-[minmax(0,0.84fr)_1px_minmax(0,1.16fr)]">
        <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--surface-2)] p-5">
          <div className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">普通智能体</div>
          <div className="mt-4 text-[1.02rem] leading-8 text-[var(--text)]">
            计算机学院通常会开设数据结构、操作系统、数据库系统等课程。建议登录教务系统查看最新课表。
          </div>
          <div className="mt-6 text-sm text-[var(--text-muted)]">能回答，但没有证据，也没有下一步。</div>
        </div>

        <div className="hidden bg-[linear-gradient(180deg,rgba(20,20,22,0),rgba(20,20,22,0.14),rgba(20,20,22,0))] lg:block" />

        <div className="rounded-[24px] border border-[rgba(47,107,255,0.16)] bg-[linear-gradient(180deg,rgba(232,238,255,0.42),rgba(255,255,255,0.96))] p-5">
          <div className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">CampusMind</div>
          <div className="mt-4 text-[1.05rem] leading-8 text-[var(--text)]">
            我先按你的学院身份查询本周公共课安排，再把课程、时间、地点和下一步入口一起整理给你。
          </div>

          <div className="mt-6 grid gap-3">
            {compareEvidence.map((item) => (
              <div key={item} className="rounded-[18px] border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-muted)]">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[20px] border border-[rgba(47,107,255,0.16)] bg-[var(--surface)] p-5">
            <div className="text-sm font-medium text-[var(--text)]">下一步</div>
            <div className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
              如果你要看个人课表，我可以继续按学号查询，并把空档时间一起标出来。
            </div>
            <Link
              href="#start-form"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              继续查看个人课表
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoryVisual({ activeIndex }: { activeIndex: number }) {
  const scene = useMemo(() => {
    if (activeIndex === 0) {
      return <HeroScene query={heroQueries[activeIndex]} reply={heroReplies[activeIndex]} />
    }
    if (activeIndex === 1) return <WorkflowScene />
    return <CompareScene />
  }, [activeIndex])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="h-full"
      >
        {scene}
      </motion.div>
    </AnimatePresence>
  )
}

function AccessPreview() {
  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,246,250,0.92))] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,107,255,0.08),transparent_45%)]" />
      <div className="relative h-full rounded-[24px] border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[0_22px_60px_rgba(20,20,22,0.08)]">
        <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.9)] px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Chat Workspace</div>
            <div className="mt-1 text-base font-semibold text-[var(--text)]">聊天工作台</div>
          </div>
          <div className="rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
            未解锁
          </div>
        </div>

        <div className="mt-4 h-[360px] rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(245,246,248,0.92),rgba(240,242,245,0.84))] p-4">
          <div className="h-full rounded-[18px] border border-dashed border-[color:var(--border)] bg-[rgba(255,255,255,0.62)] blur-[1px]" />
        </div>

        <div className="pointer-events-none absolute inset-x-8 top-[96px] z-10 rounded-[28px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.94)] shadow-[0_26px_80px_rgba(20,20,22,0.16)] backdrop-blur-md">
          <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(47,107,255,0.08),rgba(47,107,255,0.02))] px-4 py-5 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[rgba(255,255,255,0.78)] px-3 py-1 text-[11px] font-medium tracking-[0.14em] text-[var(--accent)]">
                进入工作台
              </div>
              <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">先填写变量表单。</div>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                {accessSteps.map((step) => (
                  <div key={step}>{step}</div>
                ))}
              </div>
            </div>

            <div className="relative px-4 py-5">
              <div className="absolute right-4 top-4 rounded-full border border-[color:var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text-muted)]">
                <X className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="pr-10">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">开始对话</div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">先填写变量表单，再开始对话。</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  姓名、学号和变量会写入当前会话，并用于后续查询和提示词替换。
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {accessFields.map((item) => (
                  <div key={item} className="rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3">
                    <div className="text-xs text-[var(--text-muted)]">{item}</div>
                    <div className="mt-2 h-4 w-24 rounded-full bg-[rgba(20,20,22,0.08)]" />
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3">
                <div className="text-xs text-[var(--text-muted)]">其他变量</div>
                <div className="mt-2 h-4 w-40 rounded-full bg-[rgba(20,20,22,0.08)]" />
              </div>

              <div className="mt-4 flex justify-end">
                <div className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">开始对话</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingPage() {
  const storyboardRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const lockRef = useRef(false)

  const { scrollY } = useScroll()
  const { scrollYProgress: storyboardProgress } = useScroll({
    target: storyboardRef,
    offset: ["start start", "end end"],
  })

  const [navSolid, setNavSolid] = useState(false)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (value) => setNavSolid(value > 12))
    return () => unsubscribe()
  }, [scrollY])

  useEffect(() => {
    const unsubscribe = storyboardProgress.on("change", (value) => {
      if (lockRef.current) return
      const nextIndex = Math.max(0, Math.min(storySections.length - 1, Math.round(value * (storySections.length - 1))))
      setActiveStoryIndex(nextIndex)
    })
    return () => unsubscribe()
  }, [storyboardProgress])

  const goToStory = useCallback((index: number) => {
    const target = itemRefs.current[index]
    if (!target) return
    lockRef.current = true
    setActiveStoryIndex(index)
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    window.setTimeout(() => {
      lockRef.current = false
    }, 700)
  }, [])

  const handleVisualWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 12) return
      event.preventDefault()
      const direction = event.deltaY > 0 ? 1 : -1
      const nextIndex = Math.max(0, Math.min(storySections.length - 1, activeStoryIndex + direction))
      if (nextIndex !== activeStoryIndex) goToStory(nextIndex)
    },
    [activeStoryIndex, goToStory]
  )

  return (
    <main className="bg-[var(--bg)] text-[var(--text)]">
      <header
        className={`sticky top-0 z-50 transition duration-300 ${
          navSolid
            ? "border-b border-[color:var(--border)] bg-[rgba(250,250,249,0.84)] shadow-sm backdrop-blur-xl"
            : "bg-[rgba(250,250,249,0.6)] backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-[1.7rem] font-semibold tracking-[-0.04em]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[var(--accent)]">
              <Bot className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span>智询</span>
          </Link>

          <nav className="hidden items-center gap-10 text-sm text-[var(--text-muted)] md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[var(--text)]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/chat" className="hidden text-sm text-[var(--text-muted)] transition hover:text-[var(--text)] sm:inline-flex">
              登录
            </Link>
            <Link
              href="/chat?setup=1"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
            >
              立即开始
            </Link>
          </div>
        </div>
      </header>

      <section id="storyboard" ref={storyboardRef} className="border-b border-[color:var(--border)]">
        <div className="mx-auto grid w-full max-w-7xl gap-0 px-5 sm:px-8 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.12fr)] xl:gap-12">
          <div className="xl:pr-4">
            {storySections.map((section, index) => (
              <div
                key={section.key}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
              >
                <StorySection
                  eyebrow={section.eyebrow}
                  label={section.label}
                  title={section.title}
                  description={section.description}
                  active={activeStoryIndex === index}
                  onSelect={() => goToStory(index)}
                />
              </div>
            ))}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-24 flex h-[calc(100vh-128px)] items-center py-2">
              <div className="relative w-full" onWheel={handleVisualWheel}>
                <div className="absolute -left-16 top-1/2 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
                  {storySections.map((section, index) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => goToStory(index)}
                      className={`h-10 w-1 rounded-full transition ${
                        activeStoryIndex === index ? "bg-[var(--accent)]" : "bg-[color:var(--border)]"
                      }`}
                      aria-label={section.label}
                    />
                  ))}
                </div>

                <div className="flex h-[min(76vh,760px)] flex-col overflow-hidden rounded-[34px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,246,250,0.84))] p-4 shadow-[0_32px_80px_rgba(20,20,22,0.08)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm text-[var(--text-muted)]">产品场景预览</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goToStory(Math.max(0, activeStoryIndex - 1))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStory(Math.min(storySections.length - 1, activeStoryIndex + 1))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <StoryVisual activeIndex={activeStoryIndex} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="start-form" className="border-t border-[color:var(--border)] py-24">
        <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-12 px-5 sm:px-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)]">
          <div className="max-w-2xl">
            <div className="mb-6 text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">开始之前</div>
            <h2
              className="max-w-[11ch] text-balance text-[clamp(34px,4.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.03em]"
              style={sectionHeadingStyle}
            >
              先给我你的上下文，再把事情交给我。
            </h2>
            <p className="mt-5 max-w-[26ch] text-balance text-[17px] leading-8 text-[var(--text-muted)]">
              表单不是装饰。它决定后面的回答，会不会真的贴合你的身份和当前任务。
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {accessHighlights.map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] p-4">
                  <Icon className="h-[18px] w-[18px] text-[var(--accent)]" strokeWidth={1.75} />
                  <div className="mt-3 text-base font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-ring rounded-[30px] border border-[color:var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <AccessPreview />
            <div className="mt-5 flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.88)] px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">进入方式</div>
                <div className="mt-1 text-base font-semibold text-[var(--text)]">先进入工作台，再填写表单。</div>
              </div>
              <Link
                href="/chat?setup=1"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
              >
                开始对话
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="border-t border-[color:var(--border)] py-20 scroll-mt-28">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-5 sm:px-8 xl:grid-cols-[minmax(280px,0.74fr)_minmax(0,1.18fr)] xl:gap-12">
          <div className="max-w-xl">
            <div className="mb-6 text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">工具生态</div>
            <h2
              className="max-w-[10ch] whitespace-pre-line text-balance text-[clamp(34px,4vw,50px)] font-semibold leading-[1.08] tracking-[-0.03em]"
              style={sectionHeadingStyle}
            >
              {"工具不该躲在后面，\n它们就在场景里。"}
            </h2>
            <p className="mt-5 max-w-[26ch] text-balance text-[16px] leading-8 text-[var(--text-muted)]">
              同一句校园提问，背后可能要连到课表、地图、图书馆、空教室和后续提醒。产品应该把这层能力直接展示出来。
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-muted)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.8} />
              问题触发意图，再自动接入对应工具
            </div>
          </div>

          <SectionShowcase label="Tool Graph" title="已接入的校园工具">
            <div className="space-y-4 rounded-[24px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-4 sm:px-4">
              <MarqueeRow items={tools} direction="left" duration={30} />
              <MarqueeRow items={[...tools].reverse()} direction="right" duration={26} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {toolGraphStats.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.84)] px-4 py-3.5">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.label}</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text)]">{item.value}</div>
                </div>
              ))}
            </div>
          </SectionShowcase>
        </div>
      </section>

      <section id="trust" className="border-t border-[color:var(--border)] py-20">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-5 sm:px-8 xl:grid-cols-[minmax(280px,0.74fr)_minmax(0,1.18fr)] xl:gap-12">
          <div className="max-w-xl">
            <div className="mb-6 text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">可信赖</div>
            <h2
              className="max-w-[10ch] whitespace-pre-line text-balance text-[clamp(34px,4vw,50px)] font-semibold leading-[1.08] tracking-[-0.03em]"
              style={sectionHeadingStyle}
            >
              {"会回答很重要，\n知道何时收一收更重要。"}
            </h2>
            <p className="mt-5 max-w-[26ch] text-balance text-[16px] leading-8 text-[var(--text-muted)]">
              不是每个问题都该被包装成笃定答案。证据不足时降分、保留引用、必要时转人工，才更像可以长期依赖的校园助理。
            </p>
          </div>

          <SectionShowcase label="Trust Layer" title="把判断过程摆在台面上">
            <div className="grid gap-4">
              <TrustPreviewCard icon={trustItems[0].icon} title={trustItems[0].title} description={trustItems[0].description} value="92 / 100" />
              <TrustPreviewCard icon={FileCheck2} title={trustItems[1].title} description={trustItems[1].description} value="3 条引用" />
              <TrustPreviewCard icon={TimerReset} title={trustItems[2].title} description={trustItems[2].description} value="转人工" />
            </div>
          </SectionShowcase>
        </div>
      </section>

      <section id="cta" className="border-t border-[color:var(--border)] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-[36px] border border-[color:var(--border)] bg-[var(--surface-2)] px-6 py-14 sm:px-10 md:px-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <h2
                className="max-w-[14ch] text-balance text-[clamp(30px,3.8vw,44px)] font-semibold leading-[1.12] tracking-[-0.03em]"
                style={sectionHeadingStyle}
              >
                让校园问题有证据、有步骤，也有真正能继续走下去的下一步。
              </h2>
              <Link
                href="/chat?setup=1"
                className="inline-flex h-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-base font-medium text-white transition hover:bg-[var(--accent-strong)]"
              >
                立即开始
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer id="docs" className="border-t border-[color:var(--border)] py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
            <div className="max-w-xs">
              <div className="text-xl font-semibold tracking-[-0.04em]">智询 CampusMind</div>
              <p className="mt-4 text-[13px] leading-6 text-[var(--text-muted)]">面向校园问答、流程办理与学习规划的多轮 Agent 工作台。</p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <div className="text-[13px] font-medium text-[var(--text)]">{group.title}</div>
                <div className="mt-4 space-y-3 text-[13px] text-[var(--text-muted)]">
                  {group.links.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          
        </div>
      </footer>
    </main>
  )
}
