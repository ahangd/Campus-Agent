import { NextResponse } from "next/server"

import { queryCourses, type CourseQueryInput } from "@/lib/tools/query-courses"

function readSearchParams(request: Request): CourseQueryInput {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode")

  return {
    mode: mode === "personal" || mode === "search" || mode === "auto" ? mode : undefined,
    studentId: searchParams.get("studentId"),
    semester: searchParams.get("semester"),
    weekday: searchParams.get("weekday"),
    courseName: searchParams.get("courseName"),
  }
}

export async function GET(request: Request) {
  try {
    const result = await queryCourses(readSearchParams(request))
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "课程查询失败。"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  let body: CourseQueryInput

  try {
    body = (await request.json()) as CourseQueryInput
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 })
  }

  try {
    const result = await queryCourses(body)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "课程查询失败。"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
