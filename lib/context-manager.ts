// Context Manager: collects identity inputs and restores local conversation context
// for the chat workspace without changing the existing storage model.

export {
  CHAT_STORAGE_KEY,
  FORM_STORAGE_KEY,
  buildChatSessionPayload,
  extractIdentity as collectIdentityContext,
  getStoredChatSession as restoreStoredAgentContext,
  getStoredInputs as restoreStoredAgentInputs,
  hasRequiredIdentity as hasContextIdentity,
  persistChatSession as persistAgentContext,
  type ChatSessionRecord,
  type FormValues,
  type IdentityInfo,
} from "./chat-session.ts"
