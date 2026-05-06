export type KnowledgeKind = "faq" | "regulations" | "service_process"

export type KnowledgeOption = {
  value: KnowledgeKind
  label: string
  description: string
}

export type KnowledgeField = {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
  rows?: number
}

export type ServiceProcessStep = {
  title: string
  detail: string
}

export type KnowledgeDraft = Record<string, string>

export type KnowledgeRecord = {
  id: string
  updated_at?: string | null
} & Record<string, unknown>

type KnowledgeConfig = {
  label: string
  description: string
  table: string
  emptyDraft: KnowledgeDraft
  fields: KnowledgeField[]
}

const KNOWLEDGE_KIND_CONFIG: Record<KnowledgeKind, KnowledgeConfig> = {
  faq: {
    label: "常见问答",
    description: "维护高频咨询问题和标准答案。",
    table: "faq",
    emptyDraft: {
      question: "",
      answer: "",
      category: "",
    },
    fields: [
      { key: "question", label: "问题", placeholder: "例如：缓考申请一般什么时候提交？", multiline: true, rows: 4 },
      { key: "answer", label: "回答", placeholder: "填写标准回答内容", multiline: true, rows: 8 },
      { key: "category", label: "分类", placeholder: "例如：教务、图书馆、校园生活" },
    ],
  },
  regulations: {
    label: "规章制度",
    description: "维护校规校纪、管理办法和正式制度文本。",
    table: "regulations",
    emptyDraft: {
      title: "",
      content: "",
      category: "",
      source_department: "",
    },
    fields: [
      { key: "title", label: "标题", placeholder: "例如：本科生考试管理办法" },
      { key: "content", label: "正文", placeholder: "填写制度正文或摘要", multiline: true, rows: 12 },
      { key: "category", label: "分类", placeholder: "例如：考试、图书馆、教学楼管理" },
      { key: "source_department", label: "来源部门", placeholder: "例如：教务处" },
    ],
  },
  service_process: {
    label: "办事流程",
    description: "维护申请、报修、补办等校园流程知识。",
    table: "service_process",
    emptyDraft: {
      title: "",
      process_type: "",
      description: "",
      source_department: "",
      steps: "",
    },
    fields: [
      { key: "title", label: "流程名称", placeholder: "例如：缓考申请" },
      { key: "process_type", label: "流程类型", placeholder: "例如：教务流程、生活服务" },
      { key: "description", label: "流程说明", placeholder: "简要描述适用场景", multiline: true, rows: 5 },
      { key: "source_department", label: "来源部门", placeholder: "例如：教务处" },
      {
        key: "steps",
        label: "流程步骤",
        placeholder: "每行一个步骤，或直接粘贴 JSON 数组",
        multiline: true,
        rows: 8,
      },
    ],
  },
}

export const KNOWLEDGE_KIND_OPTIONS: KnowledgeOption[] = (
  Object.entries(KNOWLEDGE_KIND_CONFIG) as [KnowledgeKind, KnowledgeConfig][]
).map(([value, config]) => ({
  value,
  label: config.label,
  description: config.description,
}))

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function isKnowledgeKind(value: string): value is KnowledgeKind {
  return value in KNOWLEDGE_KIND_CONFIG
}

export function getKnowledgeConfig(kind: KnowledgeKind) {
  return KNOWLEDGE_KIND_CONFIG[kind]
}

export function getKnowledgeTable(kind: KnowledgeKind) {
  return KNOWLEDGE_KIND_CONFIG[kind].table
}

export function emptyKnowledgeDraft(kind: KnowledgeKind) {
  return { ...KNOWLEDGE_KIND_CONFIG[kind].emptyDraft }
}

export function parseServiceProcessSteps(rawValue: string): ServiceProcessStep[] {
  const normalized = rawValue.trim()
  if (!normalized) {
    return []
  }

  try {
    const parsed = JSON.parse(normalized) as unknown
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") {
            return { title: item.trim(), detail: "" }
          }

          if (isRecord(item)) {
            return {
              title: trimText(item.title ?? item.name ?? item.step),
              detail: trimText(item.detail ?? item.description ?? item.content),
            }
          }

          return null
        })
        .filter((item): item is ServiceProcessStep => Boolean(item?.title))
    }
  } catch {
    // Fall back to line-based parsing.
  }

  return normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ title: line, detail: "" }))
}

export function formatServiceProcessSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return ""
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return ""
      }

      const title = trimText(item.title ?? item.name ?? item.step)
      const detail = trimText(item.detail ?? item.description ?? item.content)
      if (!title) {
        return ""
      }

      return detail ? `${title} - ${detail}` : title
    })
    .filter(Boolean)
    .join("\n")
}

export function buildKnowledgePayload(kind: KnowledgeKind, values: Record<string, unknown>) {
  if (kind === "faq") {
    return {
      question: trimText(values.question),
      answer: trimText(values.answer),
      category: trimText(values.category),
    }
  }

  if (kind === "regulations") {
    return {
      title: trimText(values.title),
      content: trimText(values.content),
      category: trimText(values.category),
      source_department: trimText(values.source_department),
    }
  }

  return {
    title: trimText(values.title),
    process_type: trimText(values.process_type),
    description: trimText(values.description),
    source_department: trimText(values.source_department),
    steps: parseServiceProcessSteps(trimText(values.steps)),
  }
}

export function toKnowledgeDraft(kind: KnowledgeKind, record?: KnowledgeRecord | null) {
  const draft = emptyKnowledgeDraft(kind)
  if (!record) {
    return draft
  }

  for (const key of Object.keys(draft)) {
    if (key === "steps") {
      draft[key] = formatServiceProcessSteps(record[key])
      continue
    }

    draft[key] = trimText(record[key])
  }

  return draft
}

export function getKnowledgeSummary(kind: KnowledgeKind, record: KnowledgeRecord) {
  if (kind === "faq") {
    return {
      title: trimText(record.question) || "未命名问题",
      subtitle: trimText(record.category) || "未分类",
    }
  }

  if (kind === "regulations") {
    return {
      title: trimText(record.title) || "未命名制度",
      subtitle: trimText(record.source_department) || trimText(record.category) || "未填写来源",
    }
  }

  return {
    title: trimText(record.title) || "未命名流程",
    subtitle: trimText(record.process_type) || trimText(record.source_department) || "未填写类型",
  }
}
