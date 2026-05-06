import assert from "node:assert/strict"

import {
  buildChatEvalRecordPayload,
  buildEvalMetricsPayload,
  extractStudentId,
} from "../lib/chat-eval.ts"

const metrics = {
  retrievalMs: 18,
  firstTokenAt: "2026-04-29T12:00:01.000Z",
  finishedAt: "2026-04-29T12:00:03.000Z",
  firstTokenMs: 120,
  responseMs: 2000,
  localKnowledgeHitCount: 2,
  sourceKinds: ["faq", "regulations"],
  conversationId: "conv-1",
}

assert.equal(extractStudentId({ student_id: "20240001" }), "20240001")
assert.equal(extractStudentId({ studentId: "20240002" }), "20240002")
assert.equal(extractStudentId({ student_no: "20240003" }), "20240003")
assert.equal(extractStudentId({ student_id: "   " }), null)
assert.equal(extractStudentId({}), null)

assert.deepEqual(buildEvalMetricsPayload(metrics), {
  event: "eval_metrics",
  metrics,
})

assert.deepEqual(
  buildChatEvalRecordPayload({
    question: "缓考申请通常要提前多久提交？",
    answer: "一般应在考试前按教务通知提交。",
    inputs: { studentId: "20240001" },
    metrics,
  }),
  {
    session_id: "conv-1",
    thread_id: "conv-1",
    question: "缓考申请通常要提前多久提交？",
    answer: "一般应在考试前按教务通知提交。",
    intent_type: "faq",
    created_at: "2026-04-29T12:00:03.000Z",
    student_id: "20240001",
    role: "assistant",
    content: "一般应在考试前按教务通知提交。",
    thought_log: "已命中本地知识并注入回答上下文。",
    query_log: JSON.stringify({
      conversationId: "conv-1",
      sourceKinds: ["faq", "regulations"],
      localKnowledgeHitCount: 2,
      retrievalMs: 18,
      firstTokenAt: "2026-04-29T12:00:01.000Z",
      finishedAt: "2026-04-29T12:00:03.000Z",
      firstTokenMs: 120,
      responseMs: 2000,
    }),
    tool_meta: {
      type: "chat_eval_metrics",
      version: 1,
      retrievalMs: 18,
      firstTokenAt: "2026-04-29T12:00:01.000Z",
      finishedAt: "2026-04-29T12:00:03.000Z",
      firstTokenMs: 120,
      responseMs: 2000,
      sourceKinds: ["faq", "regulations"],
      localKnowledgeHitCount: 2,
    },
  }
)

const payloadWithFallbackId = buildChatEvalRecordPayload({
  question: "图书馆今天几点闭馆？",
  answer: "总馆今天 22:00 闭馆。",
  inputs: {},
  metrics: {
    ...metrics,
    conversationId: null,
    localKnowledgeHitCount: 0,
    sourceKinds: [],
  },
})

assert.equal(payloadWithFallbackId.student_id, null)
assert.equal(payloadWithFallbackId.intent_type, "unknown")
assert.equal(payloadWithFallbackId.thought_log, "")
assert.equal(typeof payloadWithFallbackId.session_id, "string")
assert.equal(payloadWithFallbackId.session_id.startsWith("eval-"), true)
assert.equal(payloadWithFallbackId.thread_id, payloadWithFallbackId.session_id)

console.log("chat eval helpers tests passed")
