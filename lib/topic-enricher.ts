// Topic Enricher: enriches the chat agent with locally retrieved campus knowledge
// while preserving the existing lightweight retrieval implementation.

export {
  augmentChatWithLocalKnowledge as enrichAgentQueryWithTopicContext,
  buildKnowledgeContext as buildTopicContext,
  buildKnowledgeSearchTerms,
  buildLocalKnowledgeObservation as buildTopicEnricherObservation,
  rankKnowledgeRecords,
  searchLocalKnowledge as lookupTopicContext,
  type LocalKnowledgeKind as TopicContextKind,
  type LocalKnowledgeRecord as TopicContextRecord,
  type RankedKnowledgeRecord as TopicContextHit,
} from "./local-knowledge.ts"
