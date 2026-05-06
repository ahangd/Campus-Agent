import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { hasAdminSessionValue } from "@/lib/admin-auth"
import { isKnowledgeKind } from "@/lib/admin-knowledge"
import { createKnowledge, listKnowledge } from "@/lib/admin-knowledge-store"

async function ensureAdmin() {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get("campusmind-admin-session")?.value
  return hasAdminSessionValue(sessionValue)
}

export async function GET(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "未授权访问。" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get("kind") || ""
  if (!isKnowledgeKind(kind)) {
    return NextResponse.json({ error: "无效的知识类型。" }, { status: 400 })
  }

  try {
    const items = await listKnowledge(kind)
    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取知识数据失败。"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "未授权访问。" }, { status: 401 })
  }

  let body: { kind?: string; values?: Record<string, unknown> }
  try {
    body = (await request.json()) as { kind?: string; values?: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 })
  }

  const kind = body.kind || ""
  if (!isKnowledgeKind(kind)) {
    return NextResponse.json({ error: "无效的知识类型。" }, { status: 400 })
  }

  try {
    const item = await createKnowledge(kind, body.values ?? {})
    return NextResponse.json({ item })
  } catch (error) {
    const message = error instanceof Error ? error.message : "新建知识失败。"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
