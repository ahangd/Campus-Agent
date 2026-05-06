import { NextResponse } from "next/server"
import { getDifyApiKey, getDifyBaseUrl } from "@/lib/dify"
import { buildEvalMetricsPayload, persistChatEvalRecord, type ChatEvalMetrics } from "@/lib/chat-eval"
import { buildCourseAnswer, buildCourseObservation, buildCourseToolInput, detectCourseToolIntent } from "@/lib/course-tool"
import { queryCourses } from "@/lib/tools/query-courses"
import {
  buildTopicEnricherObservation,
  enrichAgentQueryWithTopicContext,
  lookupTopicContext,
  type TopicContextHit,
} from "@/lib/topic-enricher"
import { parseDifySseDataLines } from "@/lib/parse-dify-sse"
import { normalizeEvalMode, type EvalMode } from "@/lib/dify-chat-request"
import { normalizeRecentUserQueries, rewriteQueryWithHistory } from "@/lib/query-rewrite"

type Body = {
  query?: string
  conversationId?: string | null
  inputs?: Record<string, unknown>
  user?: string
  recentUserQueries?: string[]
  evalMode?: EvalMode
}

export async function POST(req: Request) {
  // Chat Agent: coordinates context rewriting, topic enrichment, model streaming,
  // and telemetry persistence for each campus consultation turn.
  const requestStartedAt = Date.now()
  const apiKey = getDifyApiKey()
  const base = getDifyBaseUrl()

  if (!apiKey) {
    return NextResponse.json({ error: "缺少环境变量 DIFY_EV_AGENT" }, { status: 500 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 })
  }

  const query = typeof body.query === "string" ? body.query.trim() : ""
  if (!query) {
    return NextResponse.json({ error: "query 不能为空" }, { status: 400 })
  }

  const user = typeof body.user === "string" && body.user.trim() ? body.user.trim() : "web-user"
  const inputs = body.inputs && typeof body.inputs === "object" ? body.inputs : {}
  const recentUserQueries = Array.isArray(body.recentUserQueries)
    ? normalizeRecentUserQueries(body.recentUserQueries.filter((item): item is string => typeof item === "string"))
    : []
  const evalMode = normalizeEvalMode(body.evalMode)
  const conversationId =
    typeof body.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : ""
  const useQueryRewrite = evalMode === "full"
  const useLocalKnowledge = evalMode !== "llm_only"
  let nextQuery = query
  let nextInputs = inputs
  let localKnowledgeHits: TopicContextHit[] = []
  let retrievalMs: number | null = null
  let courseToolResult: Awaited<ReturnType<typeof queryCourses>> | null = null
  let courseToolError: string | null = null
  const rewritten = useQueryRewrite
    ? rewriteQueryWithHistory({
        query,
        recentUserQueries,
      })
    : {
        originalQuery: query,
        rewrittenQuery: query,
        usedHistory: false,
      }

  if (detectCourseToolIntent(query)) {
    try {
      const retrievalStartedAt = Date.now()
      courseToolResult = await queryCourses(buildCourseToolInput({ query, inputs }))
      retrievalMs = Date.now() - retrievalStartedAt
    } catch (error) {
      courseToolError = error instanceof Error ? error.message : "课程查询失败。"
    }
  } else if (useLocalKnowledge) {
    try {
      const retrievalStartedAt = Date.now()
      const hits = await lookupTopicContext(rewritten.rewrittenQuery)
      retrievalMs = Date.now() - retrievalStartedAt
      localKnowledgeHits = hits
      const augmented = enrichAgentQueryWithTopicContext({
        query,
        inputs,
        hits,
      })
      nextQuery = augmented.query
      nextInputs = augmented.inputs
    } catch {
      // Ignore local knowledge lookup failures and continue with the original request.
    }
  }

  if (courseToolResult || courseToolError) {
    const encoder = new TextEncoder()
    const responseStream = new ReadableStream({
      async start(controller) {
        const firstTokenAt = new Date().toISOString()
        const finishedAt = new Date().toISOString()
        const answer = courseToolResult
          ? buildCourseAnswer(courseToolResult)
          : courseToolError || "课程查询失败。"

        if (courseToolResult) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                event: "agent_thought",
                thought: "已调用课程查询工具，正在整理课表结果。",
                tool: "query_courses",
                tool_input: buildCourseToolInput({ query, inputs }),
                observation: buildCourseObservation(courseToolResult),
              })}\n\n`
            )
          )
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              event: "message",
              answer,
              conversation_id: conversationId || `course-tool-${Date.now()}`,
            })}\n\n`
          )
        )

        const firstTokenMs = new Date(firstTokenAt).getTime() - requestStartedAt
        const responseMs = new Date(finishedAt).getTime() - requestStartedAt
        const metrics: ChatEvalMetrics = {
          retrievalMs,
          firstTokenAt,
          finishedAt,
          firstTokenMs,
          responseMs,
          localKnowledgeHitCount: 0,
          sourceKinds: courseToolResult ? ["query_courses"] : ["query_courses_error"],
          conversationId: conversationId || `course-tool-${Date.now()}`,
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(buildEvalMetricsPayload(metrics))}\n\n`))
        await persistChatEvalRecord({
          question: query,
          answer,
          inputs,
          metrics,
        })
        controller.close()
      },
    })

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  }

  try {
    // 这里是“后端代理”角色：前端永远不直接暴露 Dify Key。
    const upstream = await fetch(`${base}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: nextInputs,
        query: nextQuery,
        response_mode: "streaming",
        conversation_id: conversationId,
        user,
      }),
    })

    if (!upstream.ok) {
      // 透传上游错误文本，前端可以直接看到 Dify 返回的具体原因。
      const errText = await upstream.text()
      return new NextResponse(errText || upstream.statusText, {
        status: upstream.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "上游未返回可读流" }, { status: 502 })
    }

    // 直接把 Dify 的流式响应转发给浏览器，保持打字机效果。
    const encoder = new TextEncoder()
    const responseStream = new ReadableStream({
      async start(controller) {
        const parserDecoder = new TextDecoder()
        let parserBuffer = ""
        let answer = ""
        let firstTokenAt: string | null = null
        let finishedAt: string | null = null
        let conversationIdFromStream: string | null = conversationId || null

        if (rewritten.usedHistory && rewritten.rewrittenQuery && rewritten.rewrittenQuery !== query) {
          const rewriteEvent = {
            event: "agent_thought",
            thought: "检测到多轮指代，已为检索生成独立问句。",
            tool: "query_rewrite",
            tool_input: {
              originalQuery: query,
              recentUserQueries,
            },
            observation: rewritten.rewrittenQuery,
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(rewriteEvent)}\n\n`))
        }

        if (localKnowledgeHits.length > 0) {
          const localKnowledgeEvent = {
            event: "agent_thought",
            thought: "已命中后台知识，作为回答参考。",
            tool: "local_knowledge_lookup",
            tool_input: { query },
            observation: buildTopicEnricherObservation(localKnowledgeHits),
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(localKnowledgeEvent)}\n\n`))
        }

        const reader = upstream.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          if (value) {
            const chunkText = parserDecoder.decode(value, { stream: true })
            parserBuffer += chunkText
            const lines = parserBuffer.split("\n")
            parserBuffer = lines.pop() ?? ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) {
                continue
              }

              const payloads = parseDifySseDataLines(trimmed) as Array<{
                event?: string
                answer?: string
                conversation_id?: string
              }>

              for (const payload of payloads) {
                if (!payload || typeof payload !== "object" || payload.event === "ping") {
                  continue
                }

                if ((payload.event === "message" || payload.event === "agent_message") && typeof payload.answer === "string") {
                  if (!firstTokenAt) {
                    firstTokenAt = new Date().toISOString()
                  }

                  answer += payload.answer
                }

                if (typeof payload.conversation_id === "string" && payload.conversation_id) {
                  conversationIdFromStream = payload.conversation_id
                }
              }
            }

            controller.enqueue(value)
          }
        }

        finishedAt = new Date().toISOString()
        const firstTokenMs = firstTokenAt ? new Date(firstTokenAt).getTime() - requestStartedAt : null
        const responseMs = new Date(finishedAt).getTime() - requestStartedAt
        const metrics: ChatEvalMetrics = {
          retrievalMs,
          firstTokenAt,
          finishedAt,
          firstTokenMs,
          responseMs,
          localKnowledgeHitCount: localKnowledgeHits.length,
          sourceKinds: [...new Set(localKnowledgeHits.map((item) => item.kind))],
          conversationId: conversationIdFromStream,
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(buildEvalMetricsPayload(metrics))}\n\n`))
        await persistChatEvalRecord({
          question: query,
          answer: answer.trim(),
          inputs,
          metrics,
        })
        controller.close()
      },
      cancel() {
        upstream.body?.cancel().catch(() => undefined)
      },
    })

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    // 网络失败 / 超时等异常统一包装成 502，便于前端区分业务错误和网关错误。
    const message = error instanceof Error ? error.message : "请求 Dify /chat-messages 失败"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
