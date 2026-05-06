import assert from "node:assert/strict"

import {
  augmentChatWithLocalKnowledge,
  buildKnowledgeContext,
  buildKnowledgeSearchTerms,
  rankKnowledgeRecords,
} from "../lib/local-knowledge.ts"

assert.deepEqual(
  buildKnowledgeSearchTerms("缓考申请一般什么时候提交？").slice(0, 6),
  ["缓考申请一般什么时候提交", "缓考申请", "申请一般", "一般什么", "什么时候", "时候提交"]
)

const ranked = rankKnowledgeRecords("缓考申请什么时候提交", [
  {
    id: "faq-1",
    kind: "faq",
    title: "缓考申请一般什么时候提交？",
    content: "一般在考试前按教务通知提交。",
    category: "教务",
    sourceDepartment: "",
  },
  {
    id: "faq-2",
    kind: "faq",
    title: "图书馆借阅超期会怎样？",
    content: "会产生逾期处理记录。",
    category: "图书馆",
    sourceDepartment: "",
  },
])

assert.equal(ranked.length, 1)
assert.equal(ranked[0]?.id, "faq-1")

assert.equal(
  buildKnowledgeContext([
    {
      id: "faq-1",
      kind: "faq",
      title: "缓考申请一般什么时候提交？",
      content: "一般在考试前按教务通知提交。",
      category: "教务",
      sourceDepartment: "",
      score: 18,
    },
  ]).includes("[FAQ] 缓考申请一般什么时候提交？"),
  true
)

const augmented = augmentChatWithLocalKnowledge({
  query: "缓考申请什么时候提交",
  inputs: { student_id: "20240001" },
  hits: [
    {
      id: "faq-1",
      kind: "faq",
      title: "缓考申请一般什么时候提交？",
      content: "一般在考试前按教务通知提交。",
      category: "教务",
      sourceDepartment: "",
      score: 18,
    },
  ],
})

assert.equal(augmented.query.includes("已检索到的校园知识"), true)
assert.equal(typeof augmented.inputs.local_knowledge_context, "string")
assert.equal(Array.isArray(augmented.inputs.local_knowledge_sources), true)

const untouched = augmentChatWithLocalKnowledge({
  query: "你好",
  inputs: { student_id: "20240001" },
  hits: [],
})

assert.equal(untouched.query, "你好")
assert.deepEqual(untouched.inputs, { student_id: "20240001" })

console.log("local knowledge tests passed")
