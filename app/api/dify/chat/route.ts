import { NextResponse } from "next/server"
import { getDifyApiKey, getDifyBaseUrl } from "@/lib/dify"

type Body = {
  query?: string
  conversationId?: string | null
  inputs?: Record<string, unknown>
  user?: string
}

export async function POST(req: Request) {
  const apiKey = getDifyApiKey()
  const base = getDifyBaseUrl()

  if (!apiKey) {
    return NextResponse.json({ error: "缺少环境变量 DIFY_EV_AGENT" }, { status: 500 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 })
  }

  const query = typeof body.query === "string" ? body.query.trim() : ""
  if (!query) {
    return NextResponse.json({ error: "query 不能为空" }, { status: 400 })
  }

  const user = typeof body.user === "string" && body.user.trim() ? body.user.trim() : "web-user"
  const inputs = body.inputs && typeof body.inputs === "object" ? body.inputs : {}
  const conversationId =
    typeof body.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : ""

  try {
    // 这里是“后端代理”角色：前端永远不直接暴露 Dify Key。
    const upstream = await fetch(`${base}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        query,
        response_mode: "streaming",
        conversation_id: conversationId,
        user,
      }),
    })

    if (!upstream.ok) {
      // 透传上游错误文本，前端可以直接看到 Dify 返回的具体原因。
      const errText = await upstream.text()
      return new NextResponse(errText || upstream.statusText, {
        status: upstream.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "上游未返回可读流" }, { status: 502 })
    }

    // 直接把 Dify 的流式响应转发给浏览器，保持打字机效果。
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    // 网络失败 / 超时等异常统一包装成 502，便于前端区分业务错误和网关错误。
    const message = error instanceof Error ? error.message : "请求 Dify /chat-messages 失败"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
