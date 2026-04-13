import { Button } from "@/components/ui/button"
import { CheckCircle2, Database, GraduationCap, Layers3, School, Workflow } from "lucide-react"

const stats = [
  { icon: <School className="h-7 w-7 text-cyan-300" />, number: "全校统一", label: "咨询服务入口" },
  { icon: <GraduationCap className="h-7 w-7 text-teal-300" />, number: "师生双端", label: "使用场景覆盖" },
  { icon: <Workflow className="h-7 w-7 text-amber-300" />, number: "多轮对话", label: "上下文理解能力" },
  { icon: <Database className="h-7 w-7 text-orange-300" />, number: "可扩展", label: "知识库与模块架构" },
]

const highlights = [
  "支持围绕课程、图书馆、校园卡、报修、制度等多个业务域统一回答",
  "能够处理模糊提问、连续追问、代词指代和跨主题跳转等复杂对话",
  "可按学校部门逐步扩展知识条目，降低后续维护与迭代成本",
  "适合作为校园门户、迎新系统、信息服务平台中的智能问答入口",
]

export default function AboutSection() {
  return (
    <section id="about" className="bg-[#f3f7fb] py-24 text-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                About
              </div>
              <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">让校园咨询从“找部门”变成“直接得到答案”</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                该智能体面向高校信息咨询场景构建，目标是为师生提供一个统一、友好、可持续演进的智能服务入口。用户不需要先知道该找哪个部门，只需要提出问题，系统即可给出可执行的回答或下一步指引。
              </p>
            </div>

            <div className="space-y-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                  <span className="leading-7 text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <Button className="h-12 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800">查看系统定位</Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[28px] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-100"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-slate-50 p-3">{stat.icon}</div>
                <div className="text-3xl font-bold text-slate-900">{stat.number}</div>
                <div className="mt-2 text-sm tracking-[0.12em] text-slate-500">{stat.label}</div>
              </div>
            ))}
            <div className="rounded-[28px] bg-slate-900 p-7 text-white shadow-[0_20px_60px_rgba(8,15,29,0.18)] sm:col-span-2">
              <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
                <Layers3 className="h-7 w-7 text-cyan-300" />
              </div>
              <h3 className="text-2xl font-semibold">适合持续迭代的校园 Agent 基座</h3>
              <p className="mt-3 leading-7 text-slate-300">
                无论后续要接入迎新问答、教务问答、后勤服务还是办事大厅入口，都可以在现有能力上继续扩展，而不需要推翻重做。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
