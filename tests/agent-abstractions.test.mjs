import assert from "node:assert/strict"

import {
  collectIdentityContext,
  hasContextIdentity,
  restoreStoredAgentContext,
} from "../lib/context-manager.ts"
import {
  buildTopicEnricherObservation,
  enrichAgentQueryWithTopicContext,
  lookupTopicContext,
} from "../lib/topic-enricher.ts"

assert.deepEqual(
  collectIdentityContext({
    姓名: "张三",
    student_id: "20240001",
  }),
  {
    studentName: "张三",
    studentId: "20240001",
  }
)

assert.equal(
  hasContextIdentity({
    identity: {
      studentName: "张三",
      studentId: "20240001",
    },
  }),
  true
)

assert.equal(typeof restoreStoredAgentContext, "function")

const enriched = enrichAgentQueryWithTopicContext({
  query: "缓考申请什么时候提交？",
  inputs: {},
  hits: [
    {
      id: "faq-1",
      kind: "faq",
      title: "缓考申请一般什么时候提交？",
      content: "一般应在考试前按教务通知提交。",
      category: "教务",
      sourceDepartment: "教务处",
      score: 12,
    },
  ],
})

assert.equal(typeof enriched.query, "string")
assert.equal("local_knowledge_context" in enriched.inputs, true)

assert.equal(
  buildTopicEnricherObservation([
    {
      id: "faq-1",
      kind: "faq",
      title: "缓考申请一般什么时候提交？",
      content: "一般应在考试前按教务通知提交。",
      category: "教务",
      sourceDepartment: "教务处",
      score: 12,
    },
  ]).includes("local_knowledge_lookup"),
  true
)

assert.equal(typeof lookupTopicContext, "function")

console.log("agent abstraction tests passed")
