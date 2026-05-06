import { NextResponse } from "next/server"

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth"

export async function POST(request: Request) {
  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    return NextResponse.json({ error: "缺少 ADMIN_PASSWORD 环境变量。" }, { status: 500 })
  }

  let body: { password?: string }
  try {
    body = (await request.json()) as { password?: string }
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 })
  }

  const password = typeof body.password === "string" ? body.password : ""
  if (!verifyAdminPassword(password, adminPassword)) {
    return NextResponse.json({ error: "管理员口令错误。" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(adminPassword),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}
