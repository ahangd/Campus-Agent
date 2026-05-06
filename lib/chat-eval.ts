import { hasSupabaseAdminConfig, supabaseAdminRequest } from "./supabase-admin.ts"

export type ChatEvalMetrics = {
  retrievalMs: number | null
  firstTokenAt: string | null
  finishedAt: string | null
  firstTokenMs: number | null
  responseMs: number | null
  localKnowledgeHitCount: number
  sourceKinds: string[]
  conversationId: string | null
}

export function buildEvalMetricsPayload(metrics: ChatEvalMetrics) {
  return {
    event: "eval_metrics",
    metrics,
  }
}

export function extractStudentId(inputs: Record<string, unknown>) {
  const candidates = [inputs.student_id, inputs.studentId, inputs.student_no, inputs.stu_id, inputs.sid]
  const studentId = candidates.find((value) => typeof value === "string" && value.trim())
  return typeof studentId === "string" ? studentId.trim() : null
}

export function buildChatEvalRecordPayload({
  question,
  answer,
  inputs,
  metrics,
}: {
  question: string
  answer: string
  inputs: Record<string, unknown>
  metrics: ChatEvalMetrics
}) {
  const studentId = extractStudentId(inputs)
  const conversationId = metrics.conversationId || `eval-${Date.now()}`

  return {
    session_id: conversationId,
    thread_id: conversationId,
    question,
    answer,
    intent_type: metrics.sourceKinds[0] || "unknown",
    created_at: metrics.finishedAt || new Date().toISOString(),
    student_id: studentId,
    role: "assistant",
    content: answer,
    thought_log: metrics.localKnowledgeHitCount > 0 ? "已命中本地知识并注入回答上下文。" : "",
    query_log: JSON.stringify({
      conversationId,
      sourceKinds: metrics.sourceKinds,
      localKnowledgeHitCount: metrics.localKnowledgeHitCount,
      retrievalMs: metrics.retrievalMs,
      firstTokenAt: metrics.firstTokenAt,
      finishedAt: metrics.finishedAt,
      firstTokenMs: metrics.firstTokenMs,
      responseMs: metrics.responseMs,
    }),
    tool_meta: {
      type: "chat_eval_metrics",
      version: 1,
      retrievalMs: metrics.retrievalMs,
      firstTokenAt: metrics.firstTokenAt,
      finishedAt: metrics.finishedAt,
      firstTokenMs: metrics.firstTokenMs,
      responseMs: metrics.responseMs,
      sourceKinds: metrics.sourceKinds,
      localKnowledgeHitCount: metrics.localKnowledgeHitCount,
    },
  }
}

export async function persistChatEvalRecord({
  question,
  answer,
  inputs,
  metrics,
}: {
  question: string
  answer: string
  inputs: Record<string, unknown>
  metrics: ChatEvalMetrics
}) {
  if (!hasSupabaseAdminConfig()) {
    return
  }

  const payload = buildChatEvalRecordPayload({
    question,
    answer,
    inputs,
    metrics,
  })

  try {
    await supabaseAdminRequest("chat_records", {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Ignore chat_records persistence failures so metrics collection never blocks chat delivery.
  }
}
