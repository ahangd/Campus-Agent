import { Card, CardContent } from "@/components/ui/card"
import { Quote, Star } from "lucide-react"

const testimonials = [
  {
    name: "李同学",
    role: "本科生 / 计算机学院",
    content:
      "以前遇到校园卡、图书馆和课程时间变动，总要去不同页面找通知。现在直接问智能体，它会把步骤和入口一起告诉我，省了很多时间。",
  },
  {
    name: "王老师",
    role: "辅导员 / 学工系统使用者",
    content:
      "对于迎新阶段的大量重复问题，这类校园咨询 Agent 很有价值。它能先承接基础咨询，减少人工重复答疑压力。",
  },
  {
    name: "张同学",
    role: "研究生 / 图书馆高频用户",
    content:
      "我比较喜欢它支持连续追问，比如先问借阅规则，再追问超期怎么办，它能接着回答，不需要我重新描述背景。",
  },
]

export default function TestimonialSection() {
  return (
    <section id="testimonial" className="bg-[#f7f9fc] py-24 text-slate-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Testimonial
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">来自校园场景的真实使用反馈</h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            这个页面的价值不只是展示技术能力，更是说明它在真实校园问答场景中能够如何帮助学生和老师。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-7">
                <Quote className="mb-5 h-8 w-8 text-cyan-500" />
                <div className="mb-5 flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 leading-8 text-slate-600">“{testimonial.content}”</p>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
