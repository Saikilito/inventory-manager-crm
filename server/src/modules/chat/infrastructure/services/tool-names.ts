import { AgentTool } from '../../application/repositories/agent.repository.js';

export const ToolName = {
  SEARCH_STOCK: AgentTool.SEARCH_STOCK,
  CALCULATE_DELIVERY_FEE: AgentTool.CALCULATE_DELIVERY_FEE,
  CREATE_CLIENT: AgentTool.CREATE_CLIENT,
  CREATE_ORDER: AgentTool.CREATE_ORDER,
  WEB_FETCH: AgentTool.WEB_FETCH,
  NAVIGATE_KNOWLEDGE_BRAIN: AgentTool.NAVIGATE_KNOWLEDGE_BRAIN,
  CREATE_KNOWLEDGE_ENTRY: AgentTool.CREATE_KNOWLEDGE_ENTRY,
  QUERY_MONGODB: AgentTool.QUERY_MONGO_DB,
} as const;

export type ToolNameType = (typeof ToolName)[keyof typeof ToolName];
