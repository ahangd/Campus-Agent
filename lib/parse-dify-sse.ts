/** Parse one SSE line that may contain multiple `data: {...}` payloads (Dify). */
export function parseDifySseDataLines(line: string): unknown[] {
  const out: unknown[] = []
  let s = line.trim()
  while (s.startsWith("data:")) {
    s = s.slice(5).trimStart()
    const brace = s.indexOf("{")
    if (brace === -1) break
    let depth = 0
    let i = brace
    for (; i < s.length; i++) {
      const ch = s[i]
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          const jsonStr = s.slice(brace, i + 1)
          try {
            out.push(JSON.parse(jsonStr) as unknown)
          } catch {
            return out
          }
          s = s.slice(i + 1).trimStart()
          break
        }
      }
    }
    if (i >= s.length) break
  }
  return out
}
