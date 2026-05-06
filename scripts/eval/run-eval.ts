import {
  buildEvalCsv,
  buildEvalMarkdown,
  buildEvalSummary,
  evaluateCase,
  filterEvalTestSet,
  loadEvalTestSet,
  parseEvalArgs,
  resolveMarkdownOutputPath,
  resolveDefaultOutputPath,
  writeEvalCsv,
  writeEvalMarkdown,
} from "./eval-helpers.ts"

async function main() {
  if (process.argv.includes("--help")) {
    printHelp()
    return
  }

  const options = parseEvalArgs(process.argv.slice(2))
  const outputPath = options.outputPath || resolveDefaultOutputPath()
  const allTestSet = await loadEvalTestSet(options.inputPath)
  const testSet = filterEvalTestSet(allTestSet, options.scope)
  const results = []

  console.log(`开始评测：${testSet.length} 条问题`)
  console.log(`目标地址：${options.baseUrl}`)
  console.log(`测试范围：${options.scope}`)

  console.log(`mode: ${options.mode}`)

  for (const testCase of testSet) {
    process.stdout.write(`- [${testCase.id}] ${testCase.question} ... `)
    const result = await evaluateCase(testCase, options.baseUrl, options.timeoutMs, options.mode)
    results.push(result)

    if (result.error) {
      console.log(`失败 (${result.error})`)
      continue
    }

    console.log(`完成 (Hit@1=${result.hitAt1 ? "Y" : "N"}, ${result.responseMs}ms)`)
  }

  const csv = buildEvalCsv(results)
  await writeEvalCsv(outputPath, csv)
  const summary = buildEvalSummary(results)
  const markdownOutputPath = resolveMarkdownOutputPath(outputPath)
  const markdown = buildEvalMarkdown({
    results,
    summary,
    scope: options.scope,
    baseUrl: options.baseUrl,
  })
  await writeEvalMarkdown(markdownOutputPath, markdown)

  console.log("")
  console.log("评测完成")
  console.log(`- 总题数: ${summary.total}`)
  console.log(`- 成功数: ${summary.successCount}`)
  console.log(`- 失败数: ${summary.failedCount}`)
  console.log(`- Hit@1: ${summary.hitAt1Rate}`)
  console.log(`- Hit@3: ${summary.hitAt3Rate}`)
  console.log(`- 关键词命中率: ${summary.answerKeywordHitRate}`)
  console.log(`- 平均响应时间: ${summary.averageResponseMs}ms`)
  console.log(`- 平均首 Token 时间: ${summary.averageFirstTokenMs}ms`)
  console.log(`- 平均检索耗时: ${summary.averageRetrievalMs}ms`)
  console.log(`- CSV 输出: ${outputPath}`)
  console.log(`- Markdown 输出: ${markdownOutputPath}`)
}

function printHelp() {
  console.log("用法：")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts [--base-url <url>] [--input <file>] [--output <file>] [--scope <scope>] [--timeout-ms <ms>] [--mode <full|no_rewrite|llm_only>]")
  console.log("")
  console.log("示例：")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts --base-url http://localhost:3000")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts --scope all")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts --timeout-ms 45000")
  console.log("  node --experimental-strip-types scripts/eval/run-eval.ts --mode no_rewrite")
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "评测脚本执行失败"
  console.error(message)
  process.exitCode = 1
})
