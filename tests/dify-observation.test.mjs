import assert from "node:assert/strict"

import { formatObservationBlock } from "../lib/dify-observation.ts"

const arrayResult = formatObservationBlock(
  '{"get_rows":"{\\"data\\":[{\\"course_name\\":\\"\\u6570\\u636e\\u7ed3\\u6784\\",\\"teacher\\":\\"\\u738b\\u8001\\u5e08\\",\\"location\\":\\"A101\\"}]}"}'
)

assert.equal(arrayResult.toolName, "get_rows")
assert.equal(arrayResult.formatted.includes("\u5de5\u5177: get_rows"), true)
assert.equal(arrayResult.formatted.includes("\u8bfe\u7a0b\u540d\u79f0: \u6570\u636e\u7ed3\u6784"), true)
assert.equal(arrayResult.formatted.includes("\u6388\u8bfe\u6559\u5e08: \u738b\u8001\u5e08"), true)
assert.equal(arrayResult.formatted.includes("\u5730\u70b9: A101"), true)

const emptyArrayResult = formatObservationBlock('{"get_rows":"{\\"data\\":[]}"}')
assert.equal(emptyArrayResult.formatted.includes("\u672a\u67e5\u8be2\u5230\u7ed3\u679c\u3002"), true)

const objectResult = formatObservationBlock(
  '{"title":"\\u7f13\\u8003\\u7533\\u8bf7","status":"\\u5904\\u7406\\u4e2d","department":"\\u6559\\u52a1\\u5904"}'
)
assert.equal(objectResult.formatted.includes("\u6807\u9898: \u7f13\u8003\u7533\u8bf7"), true)
assert.equal(objectResult.formatted.includes("\u72b6\u6001: \u5904\u7406\u4e2d"), true)
assert.equal(objectResult.formatted.includes("\u9662\u7cfb: \u6559\u52a1\u5904"), true)

const textResult = formatObservationBlock('"\\u56fe\\u4e66\\u9986\\u4eca\\u65e5\\u5f00\\u653e\\u65f6\\u95f4 08:00-22:00"')
assert.equal(textResult.formatted, "\u56fe\u4e66\u9986\u4eca\u65e5\u5f00\u653e\u65f6\u95f4 08:00-22:00")

const localKnowledgeResult = formatObservationBlock(
  '{"local_knowledge_lookup":{"data":[{"title":"缓考申请一般什么时候提交？","content":"一般在考试前按教务通知提交。","category":"教务","sourceDepartment":"教务处"}]}}'
)
assert.equal(localKnowledgeResult.formatted.includes("工具: local_knowledge_lookup"), true)
assert.equal(localKnowledgeResult.formatted.includes("标题: 缓考申请一般什么时候提交？"), true)
assert.equal(localKnowledgeResult.formatted.includes("内容: 一般在考试前按教务通知提交。"), true)
assert.equal(localKnowledgeResult.formatted.includes("分类: 教务"), true)

console.log("dify observation tests passed")
