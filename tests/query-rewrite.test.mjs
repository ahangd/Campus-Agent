import assert from "node:assert/strict"

import { rewriteQueryWithHistory } from "../lib/query-rewrite.ts"

assert.deepEqual(
  rewriteQueryWithHistory({
    query: "那什么时候提交？",
    recentUserQueries: ["缓考申请一般怎么操作？"],
  }),
  {
    rewrittenQuery: "关于“缓考申请一般怎么操作？”，那什么时候提交？",
    usedHistory: true,
  }
)

assert.deepEqual(
  rewriteQueryWithHistory({
    query: "缓考申请通常要提前多久提交？",
    recentUserQueries: ["缓考申请一般怎么操作？"],
  }),
  {
    rewrittenQuery: "缓考申请通常要提前多久提交？",
    usedHistory: false,
  }
)

assert.deepEqual(
  rewriteQueryWithHistory({
    query: "这个流程怎么办？",
    recentUserQueries: [],
  }),
  {
    rewrittenQuery: "这个流程怎么办？",
    usedHistory: false,
  }
)

assert.deepEqual(
  rewriteQueryWithHistory({
    query: "需要什么材料？",
    recentUserQueries: ["校园卡补办流程是什么？", "缓考申请的具体流程是什么？"],
  }),
  {
    rewrittenQuery: "关于“缓考申请的具体流程是什么？”，需要什么材料？",
    usedHistory: true,
  }
)

console.log("query rewrite tests passed")
