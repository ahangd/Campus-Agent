import assert from "node:assert/strict"

import {
  KNOWLEDGE_KIND_OPTIONS,
  buildKnowledgePayload,
  emptyKnowledgeDraft,
  parseServiceProcessSteps,
} from "../lib/admin-knowledge.ts"

assert.deepEqual(KNOWLEDGE_KIND_OPTIONS.map((item) => item.value), [
  "faq",
  "regulations",
  "service_process",
])

assert.deepEqual(parseServiceProcessSteps(""), [])

assert.deepEqual(
  parseServiceProcessSteps('[{"title":"提交申请","detail":"在线填报"}]'),
  [{ title: "提交申请", detail: "在线填报" }]
)

assert.deepEqual(parseServiceProcessSteps("提交申请\n等待审核"), [
  { title: "提交申请", detail: "" },
  { title: "等待审核", detail: "" },
])

assert.deepEqual(emptyKnowledgeDraft("faq"), {
  question: "",
  answer: "",
  category: "",
})

assert.deepEqual(
  buildKnowledgePayload("faq", {
    question: "缓考申请一般什么时候提交？",
    answer: "一般在考试前按教务通知提交。",
    category: "教务",
  }),
  {
    question: "缓考申请一般什么时候提交？",
    answer: "一般在考试前按教务通知提交。",
    category: "教务",
  }
)

assert.deepEqual(
  buildKnowledgePayload("regulations", {
    title: "本科生考试管理办法",
    content: "考试须遵守考场纪律。",
    category: "考试",
    source_department: "教务处",
  }),
  {
    title: "本科生考试管理办法",
    content: "考试须遵守考场纪律。",
    category: "考试",
    source_department: "教务处",
  }
)

assert.deepEqual(
  buildKnowledgePayload("service_process", {
    title: "缓考申请",
    process_type: "教务流程",
    description: "用于提交缓考申请。",
    source_department: "教务处",
    steps: "提交申请\n等待审核",
  }),
  {
    title: "缓考申请",
    process_type: "教务流程",
    description: "用于提交缓考申请。",
    source_department: "教务处",
    steps: [
      { title: "提交申请", detail: "" },
      { title: "等待审核", detail: "" },
    ],
  }
)

console.log("admin knowledge tests passed")
