import type { ToolDispatcherDependencies } from '../types.js';
import { handleSearchStock } from './search-stock.handler.js';
import { handleCalculateDeliveryFee } from './calculate-delivery-fee.handler.js';
import { handleCreateClient } from './create-client.handler.js';
import { handleCreateOrder } from './create-order.handler.js';
import { handleQueryMongoDB } from './query-mongodb.handler.js';
import { handleWebFetch } from './web-fetch.handler.js';
import { handleNavigateKnowledgeBrain } from './navigate-knowledge-brain.handler.js';
import { handleCreateKnowledgeEntry } from './create-knowledge-entry.handler.js';
import { ToolName } from '../tool-names.js';

export type ToolHandler = (
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
  options?: { isFromCrm?: boolean },
) => Promise<Record<string, unknown>>;

const handlers: Record<string, ToolHandler> = {
  [ToolName.SEARCH_STOCK]: handleSearchStock,
  [ToolName.CALCULATE_DELIVERY_FEE]: handleCalculateDeliveryFee,
  [ToolName.CREATE_CLIENT]: handleCreateClient,
  [ToolName.CREATE_ORDER]: handleCreateOrder,
  [ToolName.QUERY_MONGODB]: handleQueryMongoDB,
  [ToolName.WEB_FETCH]: handleWebFetch,
  [ToolName.NAVIGATE_KNOWLEDGE_BRAIN]: handleNavigateKnowledgeBrain,
  [ToolName.CREATE_KNOWLEDGE_ENTRY]: handleCreateKnowledgeEntry,
};

export function getHandler(toolName: string): ToolHandler | undefined {
  return handlers[toolName];
}
