import ChatWorkspace from "@/components/chat-workspace"

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ thread?: string | string[]; setup?: string | string[] }>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const threadId = Array.isArray(resolved?.thread) ? resolved?.thread[0] : resolved?.thread
  const setup = Array.isArray(resolved?.setup) ? resolved?.setup[0] : resolved?.setup
  return <ChatWorkspace threadId={threadId} forceForm={setup === "1"} />
}
