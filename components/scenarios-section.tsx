import { ArrowRightLeft, BookMarked, CreditCard, Library, Settings2, Wrench } from "lucide-react"

const scenarios = [
  {
    icon: <BookMarked className="h-6 w-6 text-cyan-300" />,
    title: "教务咨询",
    description: "课程安排、上课地点、考试周事务、成绩相关说明等高频教务问题。",
  },
  {
    icon: <Library className="h-6 w-6 text-teal-300" />,
    title: "图书馆服务",
    description: "开放时间、借阅续借、座位预约、馆藏查询入口与违章说明。",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-amber-300" />,
    title: "校园卡事务",
    description: "充值、挂失、补办、消费记录、门禁与食堂使用说明。",
  },
  {
    icon: <Wrench className="h-6 w-6 text-orange-300" />,
    title: "后勤报修",
    description: "宿舍水电网络故障报修入口、流程节点、受理时间与进度查询。",
  },
]

const flow = [
  "接收自然语言问题并识别用户意图",
  "结合上下文补全指代与省略信息",
  "命中对应知识条目或业务模块",
  "输出清晰答案、步骤说明与下一步建议",
]

export default function ScenariosSection() {
  return (
    <section className="bg-[#08111d] py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Scenarios
            </div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">聚焦校园真实咨询场景，而不是泛泛聊天</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              页面展示的不只是一个“能对话”的机器人，而是一个面向校园业务问题落地的 Agent。它更关注回答是否准确、流程是否清晰、后续是否便于扩展。
            </p>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-cyan-300" />
                <h3 className="text-xl font-semibold">工作方式</h3>
              </div>
              <div className="space-y-3">
                {flow.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-2xl bg-[#0d1b2d] px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/15 text-sm font-semibold text-cyan-200">
                      {index + 1}
                    </div>
                    <div className="text-slate-200">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">{scenario.icon}</div>
                <h3 className="mb-3 text-2xl font-semibold">{scenario.title}</h3>
                <p className="leading-7 text-slate-300">{scenario.description}</p>
              </div>
            ))}
            <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-6 sm:col-span-2">
              <div className="mb-4 inline-flex rounded-2xl bg-[#0a1727] p-3">
                <Settings2 className="h-6 w-6 text-cyan-300" />
              </div>
              <h3 className="text-2xl font-semibold text-white">为后续扩展预留清晰接口</h3>
              <p className="mt-3 max-w-3xl leading-7 text-slate-200">
                未来可以继续增加迎新咨询、奖助学金、就业服务、实验室预约、行政办事等模块，让系统从咨询助手逐步演进为校园智能服务中枢。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
