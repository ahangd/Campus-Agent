import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { DifyParametersResponse } from "../../lib/dify.ts"
import { normalizeEvalMode, type EvalMode } from "../../lib/dify-chat-request.ts"
import { parseDifySseDataLines } from "../../lib/parse-dify-sse.ts"

export type EvalSourceKind = "faq" | "regulations" | "service_process" | "none"

export type EvalTestCase = {
  id: string
  question: string
  expectedSourceKind: EvalSourceKind
  expectedKeywords: string[]
  scope: EvalScope
}

export type EvalScope = "in_scope" | "partial_scope" | "out_of_scope"

export type EvalScriptOptions = {
  baseUrl: string
  inputPath: string
  outputPath?: string
  scope: EvalScope | "all"
  timeoutMs: number
  mode: EvalMode
}

export type EvalResult = {
  id: string
  question: string
  expectedSourceKind: EvalSourceKind
  scope: EvalScope
  sourceKinds: string[]
  hitAt1: boolean
  hitAt3: boolean
  answerKeywordHit: boolean
  responseMs: number
  retrievalMs: number | null
  firstTokenMs: number | null
  answer: string
  error: string
}

type DifySsePayload = {
  event?: string
  answer?: string
  observation?: string
  tool?: string
  metrics?: {
    retrievalMs?: number | null
    firstTokenMs?: number | null
    responseMs?: number | null
  }
}

type LocalKnowledgeObservation = {
  local_knowledge_lookup?: {
    data?: Array<{
      kind?: string
    }>
  }
}

type DifyFormFieldConfig = {
  label?: string | { zh_Hans?: string; zh_CN?: string; en_US?: string } | null
  variable?: string
  required?: boolean
  default?: unknown
  placeholder?: string | { zh_Hans?: string; zh_CN?: string; en_US?: string } | null
  options?: Array<{ label?: unknown; value?: string | number | boolean }>
}

type NormalizedField = {
  type: string
  config: DifyFormFieldConfig
}

export function parseEvalArgs(argv: string[]): EvalScriptOptions {
  const options: EvalScriptOptions = {
    baseUrl: process.env.EVAL_BASE_URL?.trim() || "http://localhost:3000",
    inputPath: path.resolve("scripts/eval/testset.json"),
    scope: "in_scope",
    timeoutMs: 60000,
    mode: "full",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--base-url" && next) {
      options.baseUrl = next.trim()
      index += 1
      continue
    }

    if (current === "--input" && next) {
      options.inputPath = path.resolve(next)
      index += 1
      continue
    }

    if (current === "--output" && next) {
      options.outputPath = path.resolve(next)
      index += 1
      continue
    }

    if (current === "--scope" && next) {
      options.scope = normalizeScopeOption(next)
      index += 1
      continue
    }

    if (current === "--timeout-ms" && next) {
      const parsed = Number(next)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`不支持的 --timeout-ms 参数：${next}`)
      }

      options.timeoutMs = parsed
      index += 1
      continue
    }
  }

  const modeIndex = argv.indexOf("--mode")
  if (modeIndex >= 0 && argv[modeIndex + 1]) {
    options.mode = normalizeEvalMode(argv[modeIndex + 1])
  }

  return options
}

export async function loadEvalTestSet(filePath: string) {
  const raw = await readFile(filePath, "utf8")
  const parsed = JSON.parse(raw) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error("测试集文件格式错误：根节点必须为数组。")
  }

  return parsed.map(assertEvalTestCase)
}

function assertEvalTestCase(value: unknown): EvalTestCase {
  if (!value || typeof value !== "object") {
    throw new Error("测试集项格式错误：每项必须为对象。")
  }

  const item = value as Record<string, unknown>
  const id = typeof item.id === "string" ? item.id.trim() : ""
  const question = typeof item.question === "string" ? item.question.trim() : ""
  const expectedSourceKind = normalizeSourceKind(item.expectedSourceKind)
  const scope = normalizeScope(item.scope)
  const expectedKeywords = Array.isArray(item.expectedKeywords)
    ? item.expectedKeywords.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean)
    : []

  if (!id || !question) {
    throw new Error("测试集项缺少 id 或 question。")
  }

  return {
    id,
    question,
    expectedSourceKind,
    expectedKeywords,
    scope,
  }
}

function normalizeSourceKind(value: unknown): EvalSourceKind {
  if (value === "faq" || value === "regulations" || value === "service_process" || value === "none") {
    return value
  }

  throw new Error(`不支持的 expectedSourceKind：${String(value)}`)
}

function normalizeScope(value: unknown): EvalScope {
  if (value === "in_scope" || value === "partial_scope" || value === "out_of_scope") {
    return value
  }

  throw new Error(`不支持的 scope：${String(value)}`)
}

function normalizeScopeOption(value: string): EvalScope | "all" {
  if (value === "all" || value === "in_scope" || value === "partial_scope" || value === "out_of_scope") {
    return value
  }

  throw new Error(`不支持的 --scope 参数：${value}`)
}

export async function evaluateCase(
  testCase: EvalTestCase,
  baseUrl: string,
  timeoutMs = 60000,
  mode: EvalMode = "full"
): Promise<EvalResult> {
  const startedAt = Date.now()

  try {
    const inputs = await buildEvalInputs(baseUrl)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/dify/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: testCase.question,
        inputs,
        user: process.env.EVAL_USER || "eval-runner",
        evalMode: mode,
      }),
    })
    clearTimeout(timeout)

    const parsed = await parseChatResponse(response)
    const responseMs = Date.now() - startedAt
    const sourceKinds = parsed.sourceKinds
    const answerKeywordHit = hasExpectedKeywords(parsed.answer, testCase.expectedKeywords)

    return {
      id: testCase.id,
      question: testCase.question,
      expectedSourceKind: testCase.expectedSourceKind,
      scope: testCase.scope,
      sourceKinds,
      hitAt1: isHitAt1(testCase.expectedSourceKind, sourceKinds),
      hitAt3: isHitAt3(testCase.expectedSourceKind, sourceKinds),
      answerKeywordHit,
      responseMs: parsed.responseMs ?? responseMs,
      retrievalMs: parsed.retrievalMs,
      firstTokenMs: parsed.firstTokenMs,
      answer: parsed.answer,
      error: "",
    }
  } catch (error) {
    return {
      id: testCase.id,
      question: testCase.question,
      expectedSourceKind: testCase.expectedSourceKind,
      scope: testCase.scope,
      sourceKinds: [],
      hitAt1: false,
      hitAt3: false,
      answerKeywordHit: false,
      responseMs: Date.now() - startedAt,
      retrievalMs: null,
      firstTokenMs: null,
      answer: "",
      error: error instanceof Error ? (error.name === "AbortError" ? `请求超时（>${timeoutMs}ms）` : error.message) : "评测失败",
    }
  }
}

let cachedEvalInputs: Record<string, unknown> | null = null

async function buildEvalInputs(baseUrl: string) {
  if (cachedEvalInputs) {
    return cachedEvalInputs
  }

  const studentName = process.env.EVAL_STUDENT_NAME?.trim() || "张三"
  const studentId = process.env.EVAL_STUDENT_ID?.trim() || "20240001"
  const fallbackInputs: Record<string, unknown> = {
    name: studentName,
    student_name: studentName,
    real_name: studentName,
    username: studentName,
    student_id: studentId,
    studentId: studentId,
    student_no: studentId,
    stu_id: studentId,
    sid: studentId,
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/dify/parameters`, {
      cache: "no-store",
    })

    if (!response.ok) {
      cachedEvalInputs = fallbackInputs
      return cachedEvalInputs
    }

    const data = (await response.json()) as DifyParametersResponse
    const fields = (data.user_input_form || []).map(normalizeEvalField).filter(Boolean) as NormalizedField[]
    const identityFieldKeys = buildIdentityFieldKeys(fields)
    const nextInputs: Record<string, unknown> = { ...fallbackInputs }

    for (const [index, field] of fields.entries()) {
      const key = getFieldKey(field, index)

      if (identityFieldKeys.nameKeys.includes(key)) {
        nextInputs[key] = studentName
        continue
      }

      if (identityFieldKeys.idKeys.includes(key)) {
        nextInputs[key] = studentId
        continue
      }

      nextInputs[key] = buildEvalFieldValue(field)
    }

    cachedEvalInputs = nextInputs
    return cachedEvalInputs
  } catch {
    cachedEvalInputs = fallbackInputs
    return cachedEvalInputs
  }
}

function buildEvalFieldValue(field: NormalizedField) {
  const defaultValue = getEvalDefaultValue(field)
  if (defaultValue !== "") {
    return defaultValue
  }

  if (field.type === "select" || field.type === "radio-group") {
    const firstOption = Array.isArray(field.config.options) ? field.config.options[0] : null
    return firstOption?.value ?? ""
  }

  if (field.type === "checkbox" || field.type === "switch") {
    return false
  }

  if (field.type === "number") {
    return 1
  }

  if (field.type === "json") {
    return "{}"
  }

  return "测试值"
}

function normalizeEvalField(field: Record<string, unknown>) {
  const entries = Object.entries(field)
  if (entries.length === 0) {
    return null
  }

  const [type, rawConfig] = entries[0]
  if (!rawConfig || typeof rawConfig !== "object") {
    return null
  }

  return {
    type,
    config: rawConfig as DifyFormFieldConfig,
  }
}

function getFieldKey(field: NormalizedField, index: number) {
  return typeof field.config.variable === "string" && field.config.variable.trim()
    ? field.config.variable.trim()
    : `field_${index}`
}

function getEvalDefaultValue(field: NormalizedField) {
  if (field.config.default !== undefined) {
    return field.config.default
  }

  if (field.type === "checkbox" || field.type === "switch") {
    return false
  }

  return ""
}

function buildIdentityFieldKeys(fields: NormalizedField[]) {
  const nameKeys: string[] = []
  const idKeys: string[] = []

  fields.forEach((field, index) => {
    const key = getFieldKey(field, index)
    if (isIdentityField(field, index, "name")) {
      nameKeys.push(key)
    }
    if (isIdentityField(field, index, "studentId")) {
      idKeys.push(key)
    }
  })

  return { nameKeys, idKeys }
}

function isIdentityField(field: NormalizedField, index: number, kind: "name" | "studentId") {
  const key = getFieldKey(field, index)
  const label = getEvalText(field.config.label)
  const placeholder = getEvalText(field.config.placeholder)
  const matcher = kind === "name" ? isStudentNameKey : isStudentIdKey

  return [key, label, placeholder].some((candidate) => candidate && matcher(candidate))
}

function getEvalText(value: DifyFormFieldConfig["label"] | DifyFormFieldConfig["placeholder"]) {
  if (typeof value === "string") {
    return value
  }

  if (!value || typeof value !== "object") {
    return ""
  }

  return value.zh_Hans || value.zh_CN || value.en_US || ""
}

function isStudentNameKey(key: string) {
  return includesAnyHint(key, ["name", "student_name", "real_name", "username", "姓名", "名字"])
}

function isStudentIdKey(key: string) {
  return includesAnyHint(key, ["student_id", "studentid", "stu_id", "sid", "student_no", "学号"])
}

function includesAnyHint(key: string, hints: string[]) {
  const normalized = key.trim().toLowerCase()
  return hints.some((hint) => normalized.includes(hint.toLowerCase()))
}

async function parseChatResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `请求失败 (${response.status})`)
  }

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("text/event-stream")) {
    const text = await response.text()
    throw new Error(`评测接口未返回 SSE：${text || contentType}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("无法读取评测响应流。")
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let answer = ""
  let sourceKinds: string[] = []
  let retrievalMs: number | null = null
  let firstTokenMs: number | null = null
  let responseMs: number | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) {
        continue
      }

      const payloads = parseDifySseDataLines(trimmed) as DifySsePayload[]
      for (const payload of payloads) {
        if (!payload || typeof payload !== "object" || payload.event === "ping") {
          continue
        }

        if ((payload.event === "message" || payload.event === "agent_message") && typeof payload.answer === "string") {
          answer += payload.answer
        }

        if (payload.event === "agent_thought" && payload.tool === "local_knowledge_lookup") {
          sourceKinds = extractSourceKinds(payload.observation)
        }

        if (payload.event === "eval_metrics" && payload.metrics) {
          retrievalMs = typeof payload.metrics.retrievalMs === "number" ? payload.metrics.retrievalMs : null
          firstTokenMs = typeof payload.metrics.firstTokenMs === "number" ? payload.metrics.firstTokenMs : null
          responseMs = typeof payload.metrics.responseMs === "number" ? payload.metrics.responseMs : null
        }

        if (payload.event === "error") {
          throw new Error("Dify 返回了错误事件。")
        }
      }
    }
  }

  return {
    answer: sanitizeEvalAnswer(answer),
    sourceKinds,
    retrievalMs,
    firstTokenMs,
    responseMs,
  }
}

function sanitizeEvalAnswer(raw: string) {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "")
  const danglingOpenTagIndex = text.toLowerCase().lastIndexOf("<think>")
  if (danglingOpenTagIndex >= 0) {
    text = text.slice(0, danglingOpenTagIndex)
  }

  text = text.replace(/<\/?think>/gi, "")
  return text.trim()
}

function extractSourceKinds(observation: string | undefined) {
  if (!observation) {
    return []
  }

  try {
    const parsed = JSON.parse(observation) as LocalKnowledgeObservation
    const data = parsed.local_knowledge_lookup?.data
    if (!Array.isArray(data)) {
      return []
    }

    return [...new Set(data.map((item) => item.kind).filter((kind): kind is string => typeof kind === "string" && kind.length > 0))]
  } catch {
    return []
  }
}

function hasExpectedKeywords(answer: string, keywords: string[]) {
  if (keywords.length === 0) {
    return true
  }

  const normalizedAnswer = answer.toLowerCase()
  return keywords.some((keyword) => normalizedAnswer.includes(keyword.toLowerCase()))
}

function isHitAt1(expectedSourceKind: EvalSourceKind, sourceKinds: string[]) {
  if (expectedSourceKind === "none") {
    return sourceKinds.length === 0
  }

  return sourceKinds[0] === expectedSourceKind
}

function isHitAt3(expectedSourceKind: EvalSourceKind, sourceKinds: string[]) {
  if (expectedSourceKind === "none") {
    return sourceKinds.length === 0
  }

  return sourceKinds.slice(0, 3).includes(expectedSourceKind)
}

export function buildEvalCsv(results: EvalResult[]) {
  const header = [
    "id",
    "question",
    "expectedSourceKind",
    "scope",
    "sourceKinds",
    "hitAt1",
    "hitAt3",
    "answerKeywordHit",
    "responseMs",
    "retrievalMs",
    "firstTokenMs",
    "error",
    "answer",
  ]

  const rows = results.map((result) => [
    result.id,
    result.question,
    result.expectedSourceKind,
    result.scope,
    result.sourceKinds.join("|"),
    String(result.hitAt1),
    String(result.hitAt3),
    String(result.answerKeywordHit),
    String(result.responseMs),
    result.retrievalMs === null ? "" : String(result.retrievalMs),
    result.firstTokenMs === null ? "" : String(result.firstTokenMs),
    result.error,
    result.answer,
  ])

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n")
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").replace(/"/g, "\"\"")
  return `"${normalized}"`
}

export function buildEvalSummary(results: EvalResult[]) {
  const total = results.length
  const successCount = results.filter((item) => !item.error).length
  const hitAt1Count = results.filter((item) => item.hitAt1).length
  const hitAt3Count = results.filter((item) => item.hitAt3).length
  const keywordHitCount = results.filter((item) => item.answerKeywordHit).length
  const averageResponseMs =
    total === 0 ? 0 : Math.round(results.reduce((sum, item) => sum + item.responseMs, 0) / total)
  const validFirstTokenResults = results.filter((item) => item.firstTokenMs !== null)
  const validRetrievalResults = results.filter((item) => item.retrievalMs !== null)
  const averageFirstTokenMs =
    validFirstTokenResults.length === 0
      ? 0
      : Math.round(validFirstTokenResults.reduce((sum, item) => sum + (item.firstTokenMs || 0), 0) / validFirstTokenResults.length)
  const averageRetrievalMs =
    validRetrievalResults.length === 0
      ? 0
      : Math.round(validRetrievalResults.reduce((sum, item) => sum + (item.retrievalMs || 0), 0) / validRetrievalResults.length)

  return {
    total,
    successCount,
    failedCount: total - successCount,
    hitAt1Rate: toPercent(hitAt1Count, total),
    hitAt3Rate: toPercent(hitAt3Count, total),
    answerKeywordHitRate: toPercent(keywordHitCount, total),
    averageResponseMs,
    averageFirstTokenMs,
    averageRetrievalMs,
  }
}

export function filterEvalTestSet(testSet: EvalTestCase[], scope: EvalScope | "all") {
  if (scope === "all") {
    return testSet
  }

  return testSet.filter((item) => item.scope === scope)
}

function toPercent(part: number, total: number) {
  if (total === 0) {
    return "0.00%"
  }

  return `${((part / total) * 100).toFixed(2)}%`
}

export async function writeEvalCsv(filePath: string, csv: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `\uFEFF${csv}`, "utf8")
}

export async function writeEvalMarkdown(filePath: string, markdown: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, markdown, "utf8")
}

export function buildEvalMarkdown({
  results,
  summary,
  scope,
  baseUrl,
}: {
  results: EvalResult[]
  summary: ReturnType<typeof buildEvalSummary>
  scope: EvalScope | "all"
  baseUrl: string
}) {
  const lines: string[] = [
    "# 评测结果汇总",
    "",
    `- 测试范围：\`${scope}\``,
    `- 目标地址：\`${baseUrl}\``,
    `- 总题数：${summary.total}`,
    `- 成功数：${summary.successCount}`,
    `- 失败数：${summary.failedCount}`,
    `- Hit@1：${summary.hitAt1Rate}`,
    `- Hit@3：${summary.hitAt3Rate}`,
    `- 关键词命中率：${summary.answerKeywordHitRate}`,
    `- 平均响应时间：${summary.averageResponseMs}ms`,
    `- 平均首 Token 时间：${summary.averageFirstTokenMs}ms`,
    `- 平均检索耗时：${summary.averageRetrievalMs}ms`,
    "",
    "## 逐题结果",
    "",
    "| ID | 预期来源 | Scope | Hit@1 | Hit@3 | 关键词命中 | 响应时间(ms) | 检索(ms) | 首 Token(ms) | 错误 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ]

  for (const result of results) {
    lines.push(
      `| ${escapePipe(result.id)} | ${escapePipe(result.expectedSourceKind)} | ${escapePipe(result.scope)} | ${result.hitAt1 ? "Y" : "N"} | ${result.hitAt3 ? "Y" : "N"} | ${result.answerKeywordHit ? "Y" : "N"} | ${result.responseMs} | ${result.retrievalMs ?? ""} | ${result.firstTokenMs ?? ""} | ${escapePipe(result.error || "-")} |`
    )
  }

  lines.push("", "## 说明", "", "以下问答正文可用于人工抽样复核：", "")

  for (const result of results) {
    lines.push(`### ${result.id}`)
    lines.push("")
    lines.push(`- 问题：${result.question}`)
    lines.push(`- 预期来源：${result.expectedSourceKind}`)
    lines.push(`- 实际来源：${result.sourceKinds.join(" / ") || "无"}`)
    lines.push(`- 错误：${result.error || "无"}`)
    lines.push(`- 回答：${result.answer || "无"}`)
    lines.push("")
  }

  return lines.join("\n")
}

export function resolveMarkdownOutputPath(csvPath: string) {
  const parsed = path.parse(csvPath)
  return path.join(parsed.dir, `${parsed.name}.md`)
}

export function resolveDefaultOutputPath() {
  const now = new Date()
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("")

  return path.resolve(`scripts/eval/output/eval-results-${timestamp}.csv`)
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function escapePipe(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
}
