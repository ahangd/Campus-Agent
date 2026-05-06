export function resolveInspectorTab({
  currentTab,
  requestedTab,
  pinned,
}: {
  currentTab: "plan" | "evidence" | "tools" | "reflection"
  requestedTab?: "plan" | "evidence" | "tools" | "reflection"
  pinned: boolean
}): "plan" | "evidence" | "tools" | "reflection" {
  if (pinned || !requestedTab) {
    return currentTab
  }

  return requestedTab
}
