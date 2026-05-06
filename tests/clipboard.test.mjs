import assert from "node:assert/strict"

import { copyTextToClipboard } from "../lib/clipboard.ts"

async function testClipboardApiPath() {
  let copied = ""
  const navigator = {
    clipboard: {
      async writeText(text) {
        copied = text
      },
    },
  }

  const result = await copyTextToClipboard("hello", {
    navigator,
    document: undefined,
  })

  assert.equal(result, true)
  assert.equal(copied, "hello")
}

async function testExecCommandFallback() {
  const appended = []
  const removed = []
  const textarea = {
    value: "",
    style: {},
    setAttribute() {},
    selectCalled: false,
    select() {
      this.selectCalled = true
    },
  }

  const document = {
    body: {
      appendChild(node) {
        appended.push(node)
      },
      removeChild(node) {
        removed.push(node)
      },
    },
    createElement(tag) {
      assert.equal(tag, "textarea")
      return textarea
    },
    execCommand(command) {
      assert.equal(command, "copy")
      return true
    },
  }

  const result = await copyTextToClipboard("fallback", {
    navigator: {},
    document,
  })

  assert.equal(result, true)
  assert.equal(textarea.value, "fallback")
  assert.equal(textarea.selectCalled, true)
  assert.equal(appended[0], textarea)
  assert.equal(removed[0], textarea)
}

async function testMissingClipboardSupport() {
  const result = await copyTextToClipboard("nope", {
    navigator: {},
    document: undefined,
  })

  assert.equal(result, false)
}

await testClipboardApiPath()
await testExecCommandFallback()
await testMissingClipboardSupport()

console.log("clipboard tests passed")
