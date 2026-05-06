import assert from "node:assert/strict"

import { buildInspectorMarkdown, getReflectionItems, splitInspectorBlocks } from "../lib/agent-inspector.ts"

assert.deepEqual(splitInspectorBlocks("第一段\n\n第二段\n---\n第三段"), ["第一段", "第二段", "第三段"])

assert.deepEqual(getReflectionItems(undefined), [])
assert.deepEqual(getReflectionItems({ groundedness: 4, completeness: 5, correctness: 3, tone: 5, safety: 4 }).map((item) => item.label), [
  "可信度",
  "完整性",
  "正确性",
  "语气",
  "安全性",
])

const markdown = buildInspectorMarkdown({
  thoughtBlocks: ["先识别用户意图", "再发起查询"],
  evidenceBlocks: ["命中课程表数据"],
  toolEvents: [{ name: "get_rows", input: '{"table":"courses"}', result: "返回 2 条记录", duration: 128 }],
  reflection: {
    groundedness: 4,
    completeness: 5,
    correctness: 4,
    tone: 5,
    safety: 5,
    advice: "继续保留证据引用。",
  },
  totalDuration: 520,
})

assert.equal(markdown.includes("Agent Inspector 报告"), true)
assert.equal(markdown.includes("1. 先识别用户意图"), true)
assert.equal(markdown.includes("### get_rows"), true)
assert.equal(markdown.includes("建议: 继续保留证据引用。"), true)
assert.equal(markdown.includes("总耗时: 520ms"), true)

console.log("agent inspector helpers tests passed")
