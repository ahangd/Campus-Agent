import type { ComponentType } from "react"
import {
  BellRing,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Library,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UtensilsCrossed,
} from "lucide-react"

export const navItems = [
  { label: "产品", href: "#storyboard" },
  { label: "能力", href: "#tools" },
  { label: "对比", href: "#trust" },
  { label: "文档", href: "#docs" },
]

export const storySections = [
  {
    key: "hero",
    eyebrow: "CampusMind",
    label: "产品主张",
    title: "会思考，\n不止回答。",
    description: "理解你的问题，规划下一步，调用工具，把事情继续做下去。",
  },
  {
    key: "workflow",
    eyebrow: "能力结构",
    label: "工作流",
    title: "先拆问题，\n再一步步推进。",
    description: "先判断意图，再检索证据、调工具、整理结果，让每一步都有来处，也有下一步。",
  },
  {
    key: "compare",
    eyebrow: "同题对比",
    label: "结果差异",
    title: "差别不在会不会说，\n而在能不能继续做。",
    description: "一句顺耳的话很容易，带着证据和动作入口把事情接下去，才是真正的产品能力。",
  },
] as const

export const tools = [
  "课表",
  "空教室",
  "图书馆",
  "校历",
  "校园地图",
  "食堂",
  "成绩查询",
  "教务通知",
  "奖学金",
  "缓考申请",
  "报修",
  "宿舍电费",
]

export const trustItems = [
  {
    icon: CheckCircle2,
    title: "置信度评分",
    description: "有证据就提高分数，没有证据就降低判断，不拿漂亮话冒充确定性。",
  },
  {
    icon: FileCheck2,
    title: "引用可溯源",
    description: "把命中的内容拆成证据片段，方便回看这句话究竟来自哪里。",
  },
  {
    icon: TimerReset,
    title: "低分转人工",
    description: "当过程数据不足、结果不稳时，把问题转给人工渠道，而不是硬给结论。",
  },
] as const

export const heroQueries = [
  "图书馆今晚几点闭馆？",
  "帮我看一下下周有没有空教室。",
  "这周的微积分作业怎么做？",
]

export const heroReplies = [
  "我去核对图书馆本周开放时间，再把特殊日期和闭馆说明一起带回来。",
  "我先查教学楼占用，再筛掉晚课和考试安排，给你能直接去的教室。",
  "我先按课程进度找题型、笔记和参考步骤，再把可执行的下一步整理给你。",
]

export const toolIconMap: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  课表: GraduationCap,
  空教室: Search,
  图书馆: Library,
  校历: BookOpen,
  校园地图: MapPinned,
  食堂: UtensilsCrossed,
}

export const workflowItems = [
  {
    title: "意图路由",
    body: "先判断你是在问信息、办流程，还是需要继续追问。",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  },
  {
    title: "证据检索",
    body: "把课表、图书馆、校历和通知接进来，先找依据再组织结果。",
    accent: "bg-[rgba(255,255,255,0.88)] text-[var(--text-muted)]",
  },
  {
    title: "工具调用",
    body: "查询、筛选、整理，再把结果变成你能继续操作的下一步。",
    accent: "bg-[rgba(255,255,255,0.88)] text-[var(--text-muted)]",
  },
]

export const workflowStats = [
  { label: "课表 API", value: "身份命中" },
  { label: "Agent Inspector", value: "证据同步" },
  { label: "订阅提醒", value: "后续跟进" },
]

export const compareEvidence = [
  "证据 1: 教务接口返回本周开课记录",
  "证据 2: 筛掉非计算机学院课程",
  "证据 3: 合并上课地点与周次字段",
]

export const accessSteps = ["01 进入聊天工作台", "02 填写身份与变量", "03 解锁正式对话"]

export const accessFields = ["姓名", "学号"]

export const accessHighlights = [
  { icon: GraduationCap, label: "识别身份与学院" },
  { icon: BookOpen, label: "代入课表与课程语境" },
  { icon: BellRing, label: "为后续订阅预留条件" },
  { icon: ShieldCheck, label: "只保留必要本地快照" },
]

export const toolGraphStats = [
  { label: "连接方式", value: "意图路由" },
  { label: "触发时机", value: "按需调用" },
  { label: "结果回流", value: "带证据返回" },
]

export const footerGroups = [
  { title: "产品", links: ["首页体验", "对话工作台", "表单采集"] },
  { title: "能力", links: ["意图路由", "证据检索", "工具调用"] },
  { title: "文档", links: ["使用说明", "接口代理", "本地调试"] },
  { title: "支持", links: ["常见问题", "反馈渠道", "版本记录"] },
]

export const sectionHeadingStyle = {
  fontFamily: '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Inter", system-ui, sans-serif',
}
