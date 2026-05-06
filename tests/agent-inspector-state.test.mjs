import assert from "node:assert/strict"

import { resolveInspectorTab } from "../lib/agent-inspector-state.ts"

assert.equal(
  resolveInspectorTab({ currentTab: "plan", requestedTab: "evidence", pinned: false }),
  "evidence"
)

assert.equal(
  resolveInspectorTab({ currentTab: "tools", requestedTab: "evidence", pinned: true }),
  "tools"
)

assert.equal(
  resolveInspectorTab({ currentTab: "reflection", requestedTab: undefined, pinned: false }),
  "reflection"
)

console.log("agent inspector state tests passed")
