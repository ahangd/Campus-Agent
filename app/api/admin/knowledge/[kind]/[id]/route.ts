import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { hasAdminSessionValue } from "@/lib/admin-auth"
import { isKnowledgeKind } from "@/lib/admin-knowledge"
import { removeKnowledge, updateKnowledge } from "@/lib/admin-knowledge-store"

async function ensureAdmin() {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get("campusmind-admin-session")?.value
  return hasAdminSessionValue(sessionValue)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "未授权访问。" }, { status: 401 })
  }

  const { kind, id } = await params
  if (!isKnowledgeKind(kind)) {
    return NextResponse.json({ error: "无效的知识类型。" }, { status: 400 })
  }

  let body: { values?: Record<string, unknown> }
  try {
    body = (await request.json()) as { values?: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 })
  }

  try {
    const item = await updateKnowledge(kind, id, body.values ?? {})
    return NextResponse.json({ item })
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新知识失败。"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "未授权访问。" }, { status: 401 })
  }

  const { kind, id } = await params
  if (!isKnowledgeKind(kind)) {
    return NextResponse.json({ error: "无效的知识类型。" }, { status: 400 })
  }

  try {
    await removeKnowledge(kind, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除知识失败。"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
