import { formatObservationBlock } from "./dify-observation.ts"
import { extractStudentId } from "./chat-eval.ts"
import type { CourseQueryInput, CourseQueryResult } from "./tools/query-courses.ts"

const WEEKDAY_PATTERNS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日", "星期天"] as const
const COURSE_INTENT_KEYWORDS = ["课表", "课程", "上什么课", "有什么课", "哪些课", "查课", "课"]
const PERSONAL_HINTS = ["我", "我的", "本人", "本学期", "这学期", "今天", "明天", "周一", "周二", "周三", "周四", "周五", "周六", "周日"]

function normalizeWeekday(value: string) {
  if (!value) {
    return ""
  }

  if (value.startsWith("星期")) {
    return value === "星期天" ? "周日" : value.replace("星期", "周")
  }

  return value
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function extractWeekday(query: string) {
  const matched = WEEKDAY_PATTERNS.find((item) => query.includes(item))
  return matched ? normalizeWeekday(matched) : ""
}

function extractSemester(query: string) {
  const matched = query.match(/20\d{2}\s*-\s*20\d{2}\s*[-—]?\s*[12]/)
  return matched ? matched[0].replace(/\s+/g, "") : ""
}

function extractCourseName(query: string) {
  const normalized = query.replace(/[？?。！!，,]/g, " ")
  const matched = normalized.match(/([\u4e00-\u9fffA-Za-z0-9]+?)(?:课程|课表|课)(?:\s|$)/)
  if (!matched) {
    return ""
  }

  const value = matched[1]
    .replace(/^(帮我|帮忙|麻烦|请|查询一下|查询|查一下|查查|看看)+/, "")
    .replace(/^我/, "")
    .replace(/^(这学期|本学期)的?/, "")
    .replace(/^(周[一二三四五六日]|星期[一二三四五六日天])的?/, "")

  const trimmed = normalizeText(value)
  if (!trimmed || ["什么", "哪些", "有", "上"].includes(trimmed)) {
    return ""
  }

  return trimmed
}

export function detectCourseToolIntent(query: string) {
  const normalized = normalizeText(query)
  if (!normalized) {
    return false
  }

  if (normalized.includes("课表")) {
    return true
  }

  if ((normalized.includes("什么课") || normalized.includes("哪些课") || normalized.includes("有什么课")) && /(周|星期|学期|今天|明天|我)/.test(normalized)) {
    return true
  }

  return COURSE_INTENT_KEYWORDS.some((keyword) => normalized.includes(keyword)) && /(查|查询|看|看看|安排|上)/.test(normalized)
}

export function buildCourseToolInput({
  query,
  inputs,
}: {
  query: string
  inputs: Record<string, unknown>
}): Required<CourseQueryInput> {
  const normalizedQuery = normalizeText(query)
  const studentId = extractStudentId(inputs) || ""
  const weekday = extractWeekday(normalizedQuery)
  const semester = extractSemester(normalizedQuery)
  const courseName = extractCourseName(normalizedQuery)
  const asksPersonal = PERSONAL_HINTS.some((item) => normalizedQuery.includes(item))

  return {
    mode: studentId && asksPersonal ? "personal" : "search",
    studentId,
    semester,
    weekday,
    courseName,
  }
}

export function buildCourseAnswer(result: CourseQueryResult) {
  if (!result.total) {
    return result.mode === "personal"
      ? "我已经帮你查了当前课表，但没有查到符合条件的课程。你可以换一个星期、学期或课程关键词再试一下。"
      : "我已经帮你查了课程数据，但没有找到符合条件的结果。你可以换一个课程名、星期或学期再试一下。"
  }

  const lines = result.courses.slice(0, 5).map((item, index) => {
    const schedule = [item.weekday, item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : ""].filter(Boolean).join(" ")
    const teacher = item.teacher ? `教师：${item.teacher}` : ""
    const location = [item.building || item.location, item.classroom].filter(Boolean).join("")
    return `${index + 1}. ${item.courseName || item.courseCode}${schedule ? `，时间：${schedule}` : ""}${location ? `，地点：${location}` : ""}${teacher ? `，${teacher}` : ""}`
  })

  return `${result.summary}\n\n${lines.join("\n")}`
}

export function buildCourseObservation(result: CourseQueryResult) {
  return JSON.stringify({
    query_courses: {
      data: result.courses.map((item) => ({
        course_name: item.courseName,
        course_code: item.courseCode,
        teacher: item.teacher,
        weekday: item.weekday,
        start_time: item.startTime,
        end_time: item.endTime,
        classroom: item.classroom,
        semester: item.semester,
      })),
      summary: result.summary,
      total: result.total,
      mode: result.mode,
    },
  })
}

export function buildCourseObservationText(result: CourseQueryResult) {
  return formatObservationBlock(buildCourseObservation(result)).formatted
}
