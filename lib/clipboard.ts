export async function copyTextToClipboard(
  text: string,
  options: {
    navigator?: {
      clipboard?: {
        writeText?: (value: string) => Promise<void>
      }
    }
    document?: {
      body?: {
        appendChild: (node: HTMLTextAreaElement) => void
        removeChild: (node: HTMLTextAreaElement) => void
      }
      createElement?: (tag: string) => HTMLElement
      execCommand?: (command: string) => boolean
    }
  } = {}
) {
  const navigatorRef = options.navigator ?? (typeof navigator !== "undefined" ? navigator : undefined)
  const documentRef = options.document ?? (typeof document !== "undefined" ? document : undefined)

  if (navigatorRef?.clipboard && typeof navigatorRef.clipboard.writeText === "function") {
    await navigatorRef.clipboard.writeText(text)
    return true
  }

  if (!documentRef?.createElement || !documentRef.body || typeof documentRef.execCommand !== "function") {
    return false
  }

  const textarea = documentRef.createElement("textarea") as HTMLTextAreaElement
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  textarea.style.opacity = "0"

  documentRef.body.appendChild(textarea)
  textarea.select()

  try {
    return documentRef.execCommand("copy")
  } finally {
    documentRef.body.removeChild(textarea)
  }
}
