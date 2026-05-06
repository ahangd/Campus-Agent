import assert from "node:assert/strict"

import {
  appendUserAndPendingAssistant,
  buildDifyChatRequestBody,
  closeAssistantThought,
  createStreamPayloadHandler,
  DIFY_EVENT_ERROR,
  normalizeEvalMode,
  normalizeSendQuery,
} from "../lib/dify-chat-request.ts"

assert.equal(normalizeSendQuery("  查询课表  ", false), "查询课表")
assert.equal(normalizeSendQuery("   ", false), null)
assert.equal(normalizeSendQuery("查询课表", true), null)

assert.equal(normalizeEvalMode("full"), "full")
assert.equal(normalizeEvalMode("no_rewrite"), "no_rewrite")
assert.equal(normalizeEvalMode("llm_only"), "llm_only")
assert.equal(normalizeEvalMode("unexpected"), "full")

assert.deepEqual(
  buildDifyChatRequestBody({
    query: "查询课表",
    conversationId: "conv-1",
    inputs: { student_id: "20240001" },
    user: "user-1",
  }),
  {
    query: "查询课表",
    conversationId: "conv-1",
    inputs: { student_id: "20240001" },
    user: "user-1",
  }
)

assert.deepEqual(
  buildDifyChatRequestBody({
    query: "鏌ヨ璇捐〃",
    conversationId: "conv-1",
    inputs: { student_id: "20240001" },
    user: "user-1",
    recentUserQueries: ["涓婁竴杞殑闂"],
    evalMode: "no_rewrite",
  }),
  {
    query: "鏌ヨ璇捐〃",
    conversationId: "conv-1",
    inputs: { student_id: "20240001" },
    user: "user-1",
    recentUserQueries: ["涓婁竴杞殑闂"],
    evalMode: "no_rewrite",
  }
)

assert.deepEqual(
  appendUserAndPendingAssistant(
    [{ role: "user", content: "你好" }],
    "查询课表",
    { role: "assistant", answer: "", thoughtLog: "", queryLog: "", thoughtOpen: true }
  ),
  [
    { role: "user", content: "你好" },
    { role: "user", content: "查询课表" },
    { role: "assistant", answer: "", thoughtLog: "", queryLog: "", thoughtOpen: true },
  ]
)

let conversationId = ""
let assistantState = { role: "assistant", answer: "", thoughtLog: "", queryLog: "", thoughtOpen: true }

const updateAssistantMessage = (updater) => {
  assistantState = updater(assistantState)
}

const handlePayload = createStreamPayloadHandler({
  updateAssistantMessage,
  setConversationId: (value) => {
    conversationId = value
  },
})

await handlePayload({ event: "message", answer: "你好" })
assert.equal(assistantState.answer, "你好")

await handlePayload({
  event: "agent_thought",
  thought: "先查询课程数据",
  tool: "get_rows",
  tool_input: { table: "courses" },
  observation: "命中 2 条记录",
})
assert.equal(assistantState.thoughtLog.includes("工具: get_rows"), true)
assert.equal(assistantState.queryLog.includes("命中 2 条记录"), true)

await handlePayload({ conversation_id: "conv-2" })
assert.equal(conversationId, "conv-2")

await handlePayload({ event: "message_end" })
assert.equal(assistantState.thoughtOpen, false)

closeAssistantThought(updateAssistantMessage)
assert.equal(assistantState.thoughtOpen, false)

await assert.rejects(() => handlePayload({ event: "error" }), new Error(DIFY_EVENT_ERROR))

console.log("dify chat request tests passed")
