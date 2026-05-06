import { parseDifySseDataLines } from "@/lib/parse-dify-sse"

export type DifySsePayload = {
  event?: string
  answer?: string
  conversation_id?: string
  message?: string
  code?: string
  thought?: string
  observation?: string
  tool?: string
  tool_input?: string | Record<string, unknown>
}

export async function streamDifyChatResponse(
  response: Response,
  onPayload: (payload: DifySsePayload) => void | Promise<void>
) {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `请求失败 (${response.status})`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("无法读取响应流。")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue

      const payloads = parseDifySseDataLines(trimmed) as DifySsePayload[]
      for (const payload of payloads) {
        if (!payload || typeof payload !== "object" || payload.event === "ping") continue
        await onPayload(payload)
      }
    }
  }
}
