export const PENDING_QUERY_STORAGE_KEY = "dify-ev-pending-query"
export const CHAT_HISTORY_STORAGE_KEY = "dify-ev-chat-history"

const CHAT_USER_STORAGE_KEY = "dify-chat-user-id"

export function createBrowserId(prefix: string) {
  if (typeof globalThis !== "undefined") {
    const maybeRandomUUID = globalThis.crypto?.randomUUID
    if (typeof maybeRandomUUID === "function") {
      return maybeRandomUUID.call(globalThis.crypto)
    }
  }

  return `${prefix}-${Date.now()}`
}

export function getOrCreateBrowserStoredId(prefix: string, storageKey: string = CHAT_USER_STORAGE_KEY) {
  if (typeof window === "undefined") return `${prefix}-server`

  let id = window.localStorage.getItem(storageKey)
  if (!id) {
    id = createBrowserId(prefix)
    window.localStorage.setItem(storageKey, id)
  }

  return id
}

export function readStoredArray<T>(storageKey: string) {
  if (typeof window === "undefined") return [] as T[]

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return [] as T[]

    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as T[]
  }
}

export function writeStoredValue(storageKey: string, value: unknown) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

export function updateLastMatchingItem<T>(
  items: T[],
  predicate: (item: T) => boolean,
  updater: (item: T) => T
) {
  const next = [...items]
  const last = next.at(-1)
  if (!last || !predicate(last)) return next

  next[next.length - 1] = updater(last)
  return next
}

export function removeLastMatchingItem<T>(items: T[], predicate: (item: T) => boolean) {
  const next = [...items]
  const last = next.at(-1)
  if (last && predicate(last)) {
    next.pop()
  }
  return next
}

export function appendUniqueBlock(current: string, nextBlock: string, separator: string) {
  if (!nextBlock) return current
  if (current.includes(nextBlock)) return current
  return current ? `${current}${separator}${nextBlock}` : nextBlock
}
