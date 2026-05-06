import assert from "node:assert/strict"

import {
  buildChatSessionPayload,
  extractIdentity,
  hasRequiredIdentity,
  isStudentIdKey,
  isStudentNameKey,
} from "../lib/chat-session.ts"

assert.equal(isStudentNameKey("student_name"), true)
assert.equal(isStudentNameKey("\u59d3\u540d"), true)
assert.equal(isStudentIdKey("student_id"), true)
assert.equal(isStudentIdKey("\u5b66\u53f7"), true)

assert.deepEqual(
  extractIdentity({
    "\u59d3\u540d": "\u5f20\u4e09",
    "\u5b66\u53f7": "20240001",
  }),
  { studentName: "\u5f20\u4e09", studentId: "20240001" }
)

const payload = buildChatSessionPayload(
  { department: "\u8ba1\u7b97\u673a\u5b66\u9662" },
  { studentName: "\u5f20\u4e09", studentId: "20240001" }
)

assert.equal(payload.identity?.studentName, "\u5f20\u4e09")
assert.equal(payload.identity?.studentId, "20240001")
assert.equal(payload.formValues?.name, "\u5f20\u4e09")
assert.equal(payload.formValues?.student_id, "20240001")
assert.equal(payload.formValues?.["\u59d3\u540d"], "\u5f20\u4e09")
assert.equal(payload.formValues?.["\u5b66\u53f7"], "20240001")

assert.equal(
  hasRequiredIdentity({
    identity: { studentName: "\u5f20\u4e09", studentId: "20240001" },
  }),
  true
)

assert.equal(
  hasRequiredIdentity({
    formValues: { student_name: "\u674e\u56db", student_id: "20240002" },
  }),
  true
)

assert.equal(hasRequiredIdentity({ formValues: { student_name: "\u738b\u4e94" } }), false)

console.log("chat session tests passed")
