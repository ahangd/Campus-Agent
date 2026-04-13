import { BookOpenCheck, Building2, CreditCard, MessageCircleMore, ShieldCheck, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: <BookOpenCheck className="h-8 w-8 text-cyan-300" />,
    title: "覆盖高频校园咨询",
    description:
      "系统可回答课程安排、考试周提醒、图书馆开放时间、借阅规则、校园卡充值与挂失等常见校园问题。",
  },
  {
    icon: <MessageCircleMore className="h-8 w-8 text-teal-300" />,
    title: "支持多轮对话理解",
    description:
      "不仅回答单轮提问，也能理解“那这个怎么办”“补办之后呢”这类连续追问，保持上下文一致。",
  },
  {
    icon: <CreditCard className="h-8 w-8 text-amber-300" />,
    title: "流程类问题回答清晰",
    description:
      "针对校园卡、报修、请假、证明办理等流程型问题，Agent 能给出步骤、入口、材料与注意事项。",
  },
  {
    icon: <Wrench className="h-8 w-8 text-sky-300" />,
    title: "复杂问题拆解引导",
    description:
      "当学生的问题模糊或包含多个事项时，系统会主动拆解问题并补充询问，帮助用户更快定位答案。",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-emerald-300" />,
    title: "规范问答更可信",
    description:
      "面向规章制度、学籍管理、宿舍管理等内容，可结合制度文本进行稳定输出，减少口径不一致。",
  },
  {
    icon: <Building2 className="h-8 w-8 text-orange-300" />,
    title: "知识库易扩展",
    description:
      "知识内容与功能模块可按学院、部门、业务条线持续扩展，方便后续接入更多校园服务场景。",
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-[#0a1727] py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            Features
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">围绕真实校园咨询需求设计核心能力</h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            不是简单的问答页面，而是一个能理解上下文、组织流程说明并支持后续扩展的校园服务入口。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-white/10 bg-white/5 text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/8"
            >
              <CardContent className="p-7">
                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="leading-7 text-slate-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
