import { supabaseAdminRequest } from "../supabase-admin.ts"

export type CourseQueryMode = "auto" | "personal" | "search"

export type CourseQueryInput = {
  mode?: CourseQueryMode
  studentId?: string | null
  semester?: string | null
  weekday?: string | null
  courseName?: string | null
}

type CourseRow = {
  id: string
  course_code?: string | null
  course_name?: string | null
  teacher?: string | null
  college?: string | null
  major?: string | null
  grade?: string | null
  weekday?: string | null
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  building?: string | null
  classroom?: string | null
  week_range?: string | null
  semester?: string | null
  academic_year?: string | null
  is_public?: boolean | null
}

type StudentCourseRow = {
  student_id?: string | null
  course_id?: string | null
  semester?: string | null
}

export type CourseItem = {
  id: string
  courseCode: string
  courseName: string
  teacher: string
  weekday: string
  startTime: string
  endTime: string
  classroom: string
  semester: string
  academicYear: string
  college: string
  major: string
  grade: string
  location: string
  building: string
  weekRange: string
  isPublic: boolean
}

export type CourseQueryResult = {
  ok: true
  mode: Exclude<CourseQueryMode, "auto">
  summary: string
  courses: CourseItem[]
  total: number
}

type QueryCoursesDeps = {
  request?: (path: string, init?: RequestInit) => Promise<unknown>
}

const COURSE_SELECT =
  "id,course_code,course_name,teacher,college,major,grade,weekday,start_time,end_time,location,building,classroom,week_range,semester,academic_year,is_public"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeMode(value: unknown): CourseQueryMode {
  return value === "personal" || value === "search" ? value : "auto"
}

function encodeList(values: string[]) {
  return values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")
}

function includesText(source: string, keyword: string) {
  return source.toLowerCase().includes(keyword.toLowerCase())
}

function getWeekdayOrder(value: string) {
  const normalized = value.replace(/\s+/g, "")
  const orderMap: Record<string, number> = {
    周一: 1,
    星期一: 1,
    周二: 2,
    星期二: 2,
    周三: 3,
    星期三: 3,
    周四: 4,
    星期四: 4,
    周五: 5,
    星期五: 5,
    周六: 6,
    星期六: 6,
    周日: 7,
    星期日: 7,
    星期天: 7,
  }

  return orderMap[normalized] ?? 99
}

function toCourseItem(row: CourseRow): CourseItem {
  return {
    id: row.id,
    courseCode: normalizeText(row.course_code),
    courseName: normalizeText(row.course_name),
    teacher: normalizeText(row.teacher),
    weekday: normalizeText(row.weekday),
    startTime: normalizeText(row.start_time),
    endTime: normalizeText(row.end_time),
    classroom: normalizeText(row.classroom),
    semester: normalizeText(row.semester),
    academicYear: normalizeText(row.academic_year),
    college: normalizeText(row.college),
    major: normalizeText(row.major),
    grade: normalizeText(row.grade),
    location: normalizeText(row.location),
    building: normalizeText(row.building),
    weekRange: normalizeText(row.week_range),
    isPublic: Boolean(row.is_public),
  }
}

function sortCourses(items: CourseItem[]) {
  return [...items].sort((left, right) => {
    const weekdayDiff = getWeekdayOrder(left.weekday) - getWeekdayOrder(right.weekday)
    if (weekdayDiff !== 0) {
      return weekdayDiff
    }

    const startTimeDiff = left.startTime.localeCompare(right.startTime)
    if (startTimeDiff !== 0) {
      return startTimeDiff
    }

    return left.courseName.localeCompare(right.courseName, "zh-CN")
  })
}

function filterCourses(items: CourseItem[], input: ReturnType<typeof normalizeCourseQueryInput>) {
  return items.filter((item) => {
    if (input.semester && item.semester && item.semester !== input.semester) {
      return false
    }

    if (input.weekday && item.weekday !== input.weekday) {
      return false
    }

    if (input.courseName) {
      const haystack = [item.courseName, item.courseCode, item.teacher].filter(Boolean).join(" ")
      if (!includesText(haystack, input.courseName)) {
        return false
      }
    }

    return true
  })
}

export function normalizeCourseQueryInput(input: CourseQueryInput) {
  return {
    mode: normalizeMode(input.mode),
    studentId: normalizeText(input.studentId),
    semester: normalizeText(input.semester),
    weekday: normalizeText(input.weekday),
    courseName: normalizeText(input.courseName),
  }
}

export function buildCourseSummary(courses: CourseItem[]) {
  if (!courses.length) {
    return "未查询到符合条件的课程。"
  }

  const preview = courses
    .slice(0, 3)
    .map((item) => {
      const schedule = [item.weekday, item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : ""]
        .filter(Boolean)
        .join(" ")
      const location = [item.building || item.location, item.classroom].filter(Boolean).join("")
      return [item.courseName || item.courseCode, schedule, location].filter(Boolean).join(" / ")
    })
    .join("；")

  return courses.length > 3 ? `共查询到 ${courses.length} 门课程：${preview} 等。` : `共查询到 ${courses.length} 门课程：${preview}。`
}

async function fetchPersonalCourses(
  input: ReturnType<typeof normalizeCourseQueryInput>,
  request: NonNullable<QueryCoursesDeps["request"]>
) {
  if (!input.studentId) {
    throw new Error("personal 模式下必须提供 studentId。")
  }

  const studentCourseQuery = [
    "select=student_id,course_id,semester",
    `student_id=eq.${encodeURIComponent(input.studentId)}`,
    input.semester ? `semester=eq.${encodeURIComponent(input.semester)}` : "",
    "limit=200",
  ]
    .filter(Boolean)
    .join("&")

  const selectedRows = ((await request(`student_courses?${studentCourseQuery}`)) ?? []) as StudentCourseRow[]
  const courseIds = [...new Set(selectedRows.map((item) => normalizeText(item.course_id)).filter(Boolean))]

  if (!courseIds.length) {
    return []
  }

  const courseQuery = `select=${COURSE_SELECT}&id=in.(${encodeList(courseIds)})&limit=200`
  const courseRows = ((await request(`courses?${courseQuery}`)) ?? []) as CourseRow[]
  return filterCourses(courseRows.map(toCourseItem), input)
}

async function fetchSearchCourses(
  input: ReturnType<typeof normalizeCourseQueryInput>,
  request: NonNullable<QueryCoursesDeps["request"]>
) {
  const query = [`select=${COURSE_SELECT}`, "limit=200"]

  if (input.semester) {
    query.push(`semester=eq.${encodeURIComponent(input.semester)}`)
  }

  if (input.weekday) {
    query.push(`weekday=eq.${encodeURIComponent(input.weekday)}`)
  }

  const rows = ((await request(`courses?${query.join("&")}`)) ?? []) as CourseRow[]
  return filterCourses(rows.map(toCourseItem), input)
}

export async function queryCourses(input: CourseQueryInput, deps: QueryCoursesDeps = {}): Promise<CourseQueryResult> {
  const request = deps.request ?? supabaseAdminRequest
  const normalized = normalizeCourseQueryInput(input)
  const mode: Exclude<CourseQueryMode, "auto"> =
    normalized.mode === "auto" ? (normalized.studentId ? "personal" : "search") : normalized.mode

  const courses =
    mode === "personal"
      ? await fetchPersonalCourses(normalized, request)
      : await fetchSearchCourses(normalized, request)

  const sortedCourses = sortCourses(courses)

  return {
    ok: true,
    mode,
    summary: buildCourseSummary(sortedCourses),
    courses: sortedCourses,
    total: sortedCourses.length,
  }
}
