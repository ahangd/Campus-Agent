import assert from "node:assert/strict"

import {
  buildCourseSummary,
  normalizeCourseQueryInput,
  queryCourses,
} from "../lib/tools/query-courses.ts"

assert.deepEqual(
  normalizeCourseQueryInput({
    studentId: " 20240001 ",
    semester: " 2024-2025-2 ",
    weekday: " 周一 ",
    courseName: " 数据结构 ",
  }),
  {
    mode: "auto",
    studentId: "20240001",
    semester: "2024-2025-2",
    weekday: "周一",
    courseName: "数据结构",
  }
)

assert.equal(
  buildCourseSummary([
    {
      id: "course-1",
      courseCode: "CS102",
      courseName: "数据结构",
      teacher: "李老师",
      weekday: "周一",
      startTime: "08:00",
      endTime: "09:40",
      classroom: "A101",
      semester: "2024-2025-2",
      academicYear: "",
      college: "",
      major: "",
      grade: "",
      location: "",
      building: "",
      weekRange: "",
      isPublic: false,
    },
  ]).includes("数据结构"),
  true
)

const requests = []
const personalResult = await queryCourses(
  {
    studentId: "20240001",
    semester: "2024-2025-2",
  },
  {
    request: async (path) => {
      requests.push(path)

      if (path.startsWith("student_courses?")) {
        return [
          { student_id: "20240001", course_id: "course-1", semester: "2024-2025-2" },
          { student_id: "20240001", course_id: "course-2", semester: "2024-2025-2" },
        ]
      }

      if (path.startsWith("courses?")) {
        return [
          {
            id: "course-1",
            course_code: "CS102",
            course_name: "数据结构",
            teacher: "李老师",
            weekday: "周一",
            start_time: "08:00",
            end_time: "09:40",
            classroom: "A101",
            semester: "2024-2025-2",
          },
          {
            id: "course-2",
            course_code: "GE001",
            course_name: "大学英语",
            teacher: "王老师",
            weekday: "周三",
            start_time: "10:00",
            end_time: "11:40",
            classroom: "B203",
            semester: "2024-2025-2",
          },
        ]
      }

      throw new Error(`unexpected path: ${path}`)
    },
  }
)

assert.equal(personalResult.ok, true)
assert.equal(personalResult.mode, "personal")
assert.equal(personalResult.total, 2)
assert.equal(personalResult.courses[0]?.courseName, "数据结构")
assert.equal(requests.length, 2)

const searchResult = await queryCourses(
  {
    mode: "search",
    courseName: "数据",
    weekday: "周一",
  },
  {
    request: async (path) => {
      assert.equal(path.includes("courses?"), true)
      return [
        {
          id: "course-1",
          course_code: "CS102",
          course_name: "数据结构",
          teacher: "李老师",
          weekday: "周一",
          start_time: "08:00",
          end_time: "09:40",
          classroom: "A101",
          semester: "2024-2025-2",
        },
        {
          id: "course-2",
          course_code: "CS201",
          course_name: "操作系统",
          teacher: "赵老师",
          weekday: "周二",
          start_time: "14:00",
          end_time: "15:40",
          classroom: "A202",
          semester: "2024-2025-2",
        },
      ]
    },
  }
)

assert.equal(searchResult.mode, "search")
assert.equal(searchResult.total, 1)
assert.equal(searchResult.courses[0]?.courseCode, "CS102")

const autoFallbackResult = await queryCourses(
  {
    courseName: "英语",
  },
  {
    request: async () => [
      {
        id: "course-3",
        course_code: "GE001",
        course_name: "大学英语",
        teacher: "王老师",
        weekday: "周三",
        start_time: "10:00",
        end_time: "11:40",
        classroom: "B203",
        semester: "2024-2025-2",
      },
    ],
  }
)

assert.equal(autoFallbackResult.mode, "search")
assert.equal(autoFallbackResult.total, 1)

await assert.rejects(() => queryCourses({ mode: "personal" }), /studentId/)

console.log("query courses tests passed")
