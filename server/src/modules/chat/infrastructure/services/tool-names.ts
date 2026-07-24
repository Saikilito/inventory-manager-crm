export const ToolName = {
  SEARCH_STOCK: 'searchStock',
  CALCULATE_DELIVERY_FEE: 'calculateDeliveryFee',
  CREATE_CLIENT: 'createClient',
  CREATE_ORDER: 'createOrder',
  WEB_FETCH: 'webFetch',
  NAVIGATE_KNOWLEDGE_BRAIN: 'navigateKnowledgeBrain',
  CREATE_KNOWLEDGE_ENTRY: 'createKnowledgeEntry',
  QUERY_MONGODB: 'queryMongoDB',
} as const;

export type ToolNameType = (typeof ToolName)[keyof typeof ToolName];
