import { Button } from "@/components/ui/button"
import { Bot, BookOpen, Mail, MapPin, Phone, ShieldCheck } from "lucide-react"

const productLinks = ["课程与教务咨询", "图书馆服务问答", "校园卡与办事流程", "后勤报修与制度查询"]
const supportLinks = ["知识库维护", "多轮对话能力", "扩展模块接入", "系统部署与运维"]

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#06101c] text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="mb-14 overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(135deg,#0b2035_0%,#0d1727_100%)] p-8 lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Ready To Launch
              </div>
              <h3 className="text-3xl font-bold tracking-tight lg:text-4xl">把校园高频咨询，交给一个真正可落地的智能体入口</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                从课程安排到校园卡，从图书馆到报修流程，这个落地页展示的是一个可以持续建设、持续扩展的校园智能咨询 Agent 方案。
              </p>
            </div>
            <Button className="h-14 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-8 text-base font-semibold text-slate-950 hover:from-cyan-300 hover:to-teal-300">
              <Bot className="h-5 w-5" />
              立即开始体验
            </Button>
          </div>
        </div>

        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10">
                <Bot className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <div className="text-lg font-semibold">Campus Agent</div>
                <div className="text-sm text-slate-400">校园智能咨询助手</div>
              </div>
            </div>
            <p className="leading-7 text-slate-400">
              面向高校场景的智能咨询入口，帮助师生快速获取准确答案，并为后续知识库与服务模块扩展提供基础能力。
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">核心功能</h4>
            <ul className="space-y-3 text-slate-400">
              {productLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">系统能力</h4>
            <ul className="space-y-3 text-slate-400">
              {supportLinks.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">联系信息</h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cyan-300" />
                <span>400-800-2026</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cyan-300" />
                <span>campus-agent@example.edu</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-cyan-300" />
                <span>高校智慧校园创新中心</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>? 2026 Campus Agent. 面向校园智能咨询场景的落地页演示。</p>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-300" />
              知识库可更新
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              规范内容可治理
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
