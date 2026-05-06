import { supabaseAdminRequest } from "./supabase-admin.ts"

type FaqRow = {
  id: string
  question?: string | null
  answer?: string | null
  category?: string | null
}

type RegulationRow = {
  id: string
  title?: string | null
  content?: string | null
  category?: string | null
  source_department?: string | null
}

type ServiceProcessRow = {
  id: string
  title?: string | null
  description?: string | null
  process_type?: string | null
  source_department?: string | null
  steps?: unknown
}

export type LocalKnowledgeKind = "faq" | "regulations" | "service_process"

export type LocalKnowledgeRecord = {
  id: string
  kind: LocalKnowledgeKind
  title: string
  content: string
  category: string
  sourceDepartment: string
}

export type RankedKnowledgeRecord = LocalKnowledgeRecord & {
  score: number
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function shortenText(value: string, maxLength = 180) {
  const text = value.replace(/\s+/g, " ").trim()
  if (!text) {
    return ""
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function formatSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return ""
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return ""
      }

      const record = item as Record<string, unknown>
      const title = normalizeText(record.title ?? record.name ?? record.step)
      const detail = normalizeText(record.detail ?? record.description ?? record.content)
      if (!title) {
        return ""
      }

      return detail ? `${title}: ${detail}` : title
    })
    .filter(Boolean)
    .join("；")
}

function toLocalKnowledgeRecords({
  faqRows,
  regulationRows,
  serviceProcessRows,
}: {
  faqRows: FaqRow[]
  regulationRows: RegulationRow[]
  serviceProcessRows: ServiceProcessRow[]
}) {
  const faqRecords: LocalKnowledgeRecord[] = faqRows.map((item) => ({
    id: item.id,
    kind: "faq",
    title: normalizeText(item.question) || "未命名问题",
    content: normalizeText(item.answer),
    category: normalizeText(item.category),
    sourceDepartment: "",
  }))

  const regulationRecords: LocalKnowledgeRecord[] = regulationRows.map((item) => ({
    id: item.id,
    kind: "regulations",
    title: normalizeText(item.title) || "未命名制度",
    content: normalizeText(item.content),
    category: normalizeText(item.category),
    sourceDepartment: normalizeText(item.source_department),
  }))

  const serviceProcessRecords: LocalKnowledgeRecord[] = serviceProcessRows.map((item) => ({
    id: item.id,
    kind: "service_process",
    title: normalizeText(item.title) || "未命名流程",
    content: [normalizeText(item.description), formatSteps(item.steps)].filter(Boolean).join("；"),
    category: normalizeText(item.process_type),
    sourceDepartment: normalizeText(item.source_department),
  }))

  return [...faqRecords, ...regulationRecords, ...serviceProcessRecords].filter((item) => item.content || item.title)
}

export function buildKnowledgeSearchTerms(query: string) {
  const normalized = query.replace(/[，。！？、,.!?;；:：()\[\]{}"'“”‘’]/g, " ").replace(/\s+/g, " ").trim()
  if (!normalized) {
    return []
  }

  const terms: string[] = [normalized]
  const chunks = normalized.match(/[\u4e00-\u9fff]+|[A-Za-z0-9_-]+/g) ?? []

  for (const chunk of chunks) {
    if (/^[\u4e00-\u9fff]+$/.test(chunk)) {
      if (chunk.length >= 4) {
        for (let index = 0; index <= chunk.length - 4; index += 2) {
          terms.push(chunk.slice(index, index + 4))
        }
      }

      if (chunk.length >= 2) {
        for (let index = 0; index <= chunk.length - 2; index += 2) {
          terms.push(chunk.slice(index, index + 2))
        }
      }

      continue
    }

    if (chunk.length >= 2) {
      terms.push(chunk.toLowerCase())
    }
  }

  return dedupe(terms)
}

export function rankKnowledgeRecords(query: string, records: LocalKnowledgeRecord[], maxItems = 4) {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) {
    return []
  }

  const terms = buildKnowledgeSearchTerms(normalizedQuery)

  return records
    .map((record) => {
      const haystack = `${record.title} ${record.content} ${record.category} ${record.sourceDepartment}`.toLowerCase()
      let score = 0

      if (haystack.includes(normalizedQuery.toLowerCase())) {
        score += 12
      }

      for (const term of terms) {
        const lowerTerm = term.toLowerCase()
        if (lowerTerm.length < 2) {
          continue
        }

        if (haystack.includes(lowerTerm)) {
          score += Math.min(6, lowerTerm.length)
        }
      }

      return { ...record, score }
    })
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItems)
}

export function buildKnowledgeContext(records: RankedKnowledgeRecord[]) {
  return records
    .map((record) => {
      const sourceLabel =
        record.kind === "faq" ? "FAQ" : record.kind === "regulations" ? "规章制度" : "办事流程"
      const metadata = [record.category, record.sourceDepartment].filter(Boolean).join(" / ")

      return [
        `[${sourceLabel}] ${record.title}`,
        metadata ? `分类: ${metadata}` : "",
        `内容: ${shortenText(record.content)}`,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")
}

export function buildLocalKnowledgeObservation(records: RankedKnowledgeRecord[]) {
  return JSON.stringify({
    local_knowledge_lookup: {
      data: records.map((record) => ({
        title: record.title,
        content: shortenText(record.content),
        category: record.category,
        sourceDepartment: record.sourceDepartment,
        kind: record.kind,
      })),
    },
  })
}

export function augmentChatWithLocalKnowledge({
  query,
  inputs,
  hits,
}: {
  query: string
  inputs: Record<string, unknown>
  hits: RankedKnowledgeRecord[]
}) {
  if (!hits.length) {
    return { query, inputs }
  }

  const context = buildKnowledgeContext(hits)
  const sources = hits.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    category: item.category,
    sourceDepartment: item.sourceDepartment,
  }))

  return {
    query: `${query}\n\n已检索到的校园知识（回答时优先参考以下内容）:\n${context}`,
    inputs: {
      ...inputs,
      local_knowledge_context: context,
      local_knowledge_sources: sources,
    },
  }
}

export async function searchLocalKnowledge(query: string) {
  const [faqRows, regulationRows, serviceProcessRows] = await Promise.all([
    supabaseAdminRequest("faq?select=id,question,answer,category&limit=200"),
    supabaseAdminRequest("regulations?select=id,title,content,category,source_department&limit=200"),
    supabaseAdminRequest("service_process?select=id,title,description,process_type,source_department,steps&limit=200"),
  ])

  const records = toLocalKnowledgeRecords({
    faqRows: Array.isArray(faqRows) ? (faqRows as FaqRow[]) : [],
    regulationRows: Array.isArray(regulationRows) ? (regulationRows as RegulationRow[]) : [],
    serviceProcessRows: Array.isArray(serviceProcessRows) ? (serviceProcessRows as ServiceProcessRow[]) : [],
  })

  return rankKnowledgeRecords(query, records)
}
