import assert from "node:assert/strict"

import {
  buildCourseAnswer,
  buildCourseToolInput,
  detectCourseToolIntent,
} from "../lib/course-tool.ts"

assert.equal(detectCourseToolIntent("我这学期有什么课？"), true)
assert.equal(detectCourseToolIntent("帮我查一下周一有什么课"), true)
assert.equal(detectCourseToolIntent("缓考申请什么时候提交？"), false)

assert.deepEqual(
  buildCourseToolInput({
    query: "帮我查一下我周三的数据结构课",
    inputs: {
      student_id: "20240001",
    },
  }),
  {
    mode: "personal",
    studentId: "20240001",
    semester: "",
    weekday: "周三",
    courseName: "数据结构",
  }
)

assert.deepEqual(
  buildCourseToolInput({
    query: "查询周一的数据结构课程",
    inputs: {},
  }),
  {
    mode: "search",
    studentId: "",
    semester: "",
    weekday: "周一",
    courseName: "数据结构",
  }
)

assert.equal(
  buildCourseAnswer({
    ok: true,
    mode: "personal",
    summary: "共查询到 2 门课程：数据结构 / 周一 08:00-09:40 / A101；大学英语 / 周三 10:00-11:40 / B203。",
    total: 2,
    courses: [
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
      {
        id: "course-2",
        courseCode: "GE001",
        courseName: "大学英语",
        teacher: "王老师",
        weekday: "周三",
        startTime: "10:00",
        endTime: "11:40",
        classroom: "B203",
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
    ],
  }).includes("数据结构"),
  true
)

console.log("course tool tests passed")
