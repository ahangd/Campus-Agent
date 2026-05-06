const CONTEXTUAL_QUERY_HINTS = [
  "那",
  "这个",
  "这个问题",
  "这个流程",
  "这个规定",
  "这项",
  "这条",
  "这个申请",
  "这门课",
  "它",
  "其",
  "上述",
  "刚才",
  "前面",
  "上面",
  "这里",
  "那里",
  "然后",
  "接着",
  "材料",
  "步骤",
  "多久",
  "多久能",
  "多久可以",
  "哪里",
  "怎么做",
]

const COMPLETE_QUERY_KEYWORDS = [
  "校园卡",
  "图书馆",
  "缓考",
  "教室",
  "宿舍",
  "奖学金",
  "教务",
  "考试",
  "课程",
  "课表",
  "学生证",
  "学籍",
  "离校",
  "成绩",
  "转专业",
]

export function rewriteQueryWithHistory({
  query,
  recentUserQueries,
}: {
  query: string
  recentUserQueries: string[]
}) {
  const normalizedQuery = query.trim()
  const history = recentUserQueries.map((item) => item.trim()).filter(Boolean)

  if (!normalizedQuery || history.length === 0) {
    return {
      rewrittenQuery: normalizedQuery,
      usedHistory: false,
    }
  }

  if (!shouldRewriteQuery(normalizedQuery)) {
    return {
      rewrittenQuery: normalizedQuery,
      usedHistory: false,
    }
  }

  const latestContext = history[history.length - 1]
  return {
    rewrittenQuery: `关于“${latestContext}”，${normalizedQuery}`,
    usedHistory: true,
  }
}

export function shouldRewriteQuery(query: string) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    return false
  }

  if (COMPLETE_QUERY_KEYWORDS.some((keyword) => normalizedQuery.includes(keyword))) {
    return false
  }

  return CONTEXTUAL_QUERY_HINTS.some((hint) => normalizedQuery.includes(hint))
}

export function normalizeRecentUserQueries(messages: string[], maxItems = 3) {
  return messages
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(-maxItems)
}
