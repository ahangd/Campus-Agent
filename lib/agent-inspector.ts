export function splitInspectorBlocks(value: string) {
  return value
    .split(/\n{2,}|---+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getReflectionItems(reflection?: {
  groundedness: number
  completeness: number
  correctness: number
  tone: number
  safety: number
}) {
  if (!reflection) {
    return []
  }

  return [
    { key: "groundedness", label: "\u53ef\u4fe1\u5ea6", score: reflection.groundedness },
    { key: "completeness", label: "\u5b8c\u6574\u6027", score: reflection.completeness },
    { key: "correctness", label: "\u6b63\u786e\u6027", score: reflection.correctness },
    { key: "tone", label: "\u8bed\u6c14", score: reflection.tone },
    { key: "safety", label: "\u5b89\u5168\u6027", score: reflection.safety },
  ]
}

function renderNumberedSection(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n\n") || "\u65e0"
}

function renderToolSection(toolEvents: Array<{ name: string; input: string; result: string; duration: number | null }>) {
  return (
    toolEvents
      .map(
        (tool) =>
          `### ${tool.name}\n**\u53c2\u6570:**\n\`\`\`\n${tool.input}\n\`\`\`\n**\u7ed3\u679c:**\n${tool.result}\n**\u8017\u65f6:** ${
            tool.duration ?? "--"
          }ms`
      )
      .join("\n\n") || "\u65e0"
  )
}

export function buildInspectorMarkdown({
  thoughtBlocks,
  evidenceBlocks,
  toolEvents,
  reflection,
  totalDuration,
}: {
  thoughtBlocks: string[]
  evidenceBlocks: string[]
  toolEvents: Array<{ name: string; input: string; result: string; duration: number | null }>
  reflection?: {
    groundedness: number
    completeness: number
    correctness: number
    tone: number
    safety: number
    advice: string
  }
  totalDuration?: number
}) {
  return `# Agent Inspector \u62a5\u544a

## \u89c4\u5212\u6b65\u9aa4
${renderNumberedSection(thoughtBlocks)}

## \u68c0\u7d22\u8bc1\u636e
${renderNumberedSection(evidenceBlocks)}

## \u5de5\u5177\u8c03\u7528
${renderToolSection(toolEvents)}

## \u8d28\u91cf\u8bc4\u4f30
${
  reflection
    ? `- \u53ef\u4fe1\u5ea6: ${reflection.groundedness}/5
- \u5b8c\u6574\u6027: ${reflection.completeness}/5
- \u6b63\u786e\u6027: ${reflection.correctness}/5
- \u8bed\u6c14: ${reflection.tone}/5
- \u5b89\u5168\u6027: ${reflection.safety}/5

\u5efa\u8bae: ${reflection.advice}`
    : "\u65e0"
}

---
\u751f\u6210\u65f6\u95f4: ${new Date().toLocaleString("zh-CN")}
\u603b\u8017\u65f6: ${totalDuration ?? "--"}ms`
}
