import { NextResponse } from "next/server"
import { getDifyApiKey, getDifyBaseUrl } from "@/lib/dify"

export async function GET() {
  const apiKey = getDifyApiKey()
  const base = getDifyBaseUrl()

  if (!apiKey) {
    return NextResponse.json({ error: "缺少环境变量 DIFY_EV_AGENT" }, { status: 500 })
  }

  try {
    const upstream = await fetch(`${base}/parameters`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return new NextResponse(errText || upstream.statusText, {
        status: upstream.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    const data = await upstream.json()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求 Dify /parameters 失败"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
