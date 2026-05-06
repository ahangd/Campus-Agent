import assert from "node:assert/strict"

import {
  buildReflection,
  buildThoughtBlock,
  calculateTotalDuration,
  extractLocalKnowledgeSources,
  findLatestAssistantMessage,
  parseToolEvents,
  removeEmptyPendingAssistant,
  sanitizeAssistantAnswer,
  sanitizeInspectorText,
} from "../lib/dify-chat-message.ts"

assert.equal(sanitizeAssistantAnswer("你好<think>隐藏内容</think>世界"), "你好世界")
assert.equal(sanitizeAssistantAnswer("你好<think>未闭合"), "你好")
assert.equal(sanitizeInspectorText("步骤一<think>隐藏</think>\n\n\n步骤二"), "步骤一\n\n步骤二")

assert.deepEqual(
  buildThoughtBlock({
    thought: "先查课表",
    tool: "get_rows",
    tool_input: { table: "courses" },
    observation: "查到了 2 条记录",
  }),
  {
    thoughtBlock: '先查课表\n工具: get_rows\n输入: {"table":"courses"}',
    observation: "查到了 2 条记录",
  }
)

assert.deepEqual(
  buildThoughtBlock({
    thought: "步骤一<think>隐藏内容</think>",
    observation: "<think>中间过程</think>命中 1 条记录",
  }),
  {
    thoughtBlock: "步骤一",
    observation: "命中 1 条记录",
  }
)

assert.equal(calculateTotalDuration([{ name: "a", duration: 120 }, { name: "b", duration: 80 }]), 200)
assert.equal(calculateTotalDuration(), null)

const reflection = buildReflection({
  role: "assistant",
  answer: "这里是一个带证据的较完整回答，用来测试反思评分逻辑是否正常工作。",
  thoughtLog: "步骤一\n\n步骤二",
  queryLog: "证据一\n\n证据二",
  thoughtOpen: false,
})
assert.equal(reflection.groundedness >= 4, true)
assert.equal(reflection.correctness >= 4, true)

const toolEvents = parseToolEvents({
  role: "assistant",
  answer: "已完成",
  thoughtLog: '先查课表\n工具: get_rows\n输入: {"table":"courses"}',
  queryLog: '{"get_rows":"{\\"data\\":[{\\"course_name\\":\\"数据结构\\",\\"teacher\\":\\"王老师\\"}]}"}',
  thoughtOpen: false,
  toolDurations: [{ name: "get_rows", duration: 132 }],
})
assert.equal(toolEvents.length, 1)
assert.equal(toolEvents[0].name, "get_rows")
assert.equal(toolEvents[0].duration, 132)

const localKnowledgeSources = extractLocalKnowledgeSources({
  role: "assistant",
  answer: "已完成",
  thoughtLog: '已命中后台知识，作为回答参考。\n工具: local_knowledge_lookup\n输入: {"query":"缓考申请什么时候提交"}',
  queryLog: '{"local_knowledge_lookup":{"data":[{"title":"缓考申请一般什么时候提交？","content":"一般在考试前按教务通知提交。","category":"教务","sourceDepartment":"教务处","kind":"faq"},{"title":"缓考申请","content":"按流程提交。","category":"教务流程","sourceDepartment":"教务处","kind":"service_process"}]}}',
  thoughtOpen: false,
})
assert.equal(localKnowledgeSources.length, 2)
assert.equal(localKnowledgeSources[0].kindLabel, "FAQ")
assert.equal(localKnowledgeSources[0].title, "缓考申请一般什么时候提交？")
assert.equal(localKnowledgeSources[1].kindLabel, "办事流程")

assert.deepEqual(
  removeEmptyPendingAssistant([
    { role: "user", content: "你好" },
    { role: "assistant", answer: "", thoughtLog: "", queryLog: "" },
  ]),
  [{ role: "user", content: "你好" }]
)

assert.deepEqual(
  findLatestAssistantMessage([
    { role: "user", content: "a" },
    { role: "assistant", answer: "b", thoughtLog: "", queryLog: "", thoughtOpen: false },
  ])?.answer,
  "b"
)

console.log("dify chat message tests passed")
