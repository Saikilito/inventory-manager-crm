import { AgentRole, type AgentRole as AgentRoleType } from '../../../../../../shared-domain/src/chat/agent.entity.js';
import { ToolName, type ToolNameType } from './tool-names.js';

export interface ToolPermissionContext {
  profile?: AgentRoleType;
  isFromCrm?: boolean;
  enabledTools?: readonly string[];
}

const ALL_TOOL_NAMES = new Set<string>(Object.values(ToolName));

const DEFAULT_TOOLS_BY_PROFILE: Record<AgentRoleType, readonly ToolNameType[]> = {
  [AgentRole.SALES]: [
    ToolName.SEARCH_STOCK,
    ToolName.CALCULATE_DELIVERY_FEE,
    ToolName.CREATE_CLIENT,
    ToolName.CREATE_ORDER,
    ToolName.WEB_FETCH,
  ],
  [AgentRole.SUPPORT]: [ToolName.SEARCH_STOCK, ToolName.CALCULATE_DELIVERY_FEE],
  [AgentRole.CRM_OPERATOR]: [ToolName.QUERY_MONGODB],
  [AgentRole.LIBRARIAN]: [
    ToolName.SEARCH_STOCK,
    ToolName.WEB_FETCH,
    ToolName.NAVIGATE_KNOWLEDGE_BRAIN,
    ToolName.CREATE_KNOWLEDGE_ENTRY,
    ToolName.QUERY_MONGODB,
  ],
};

export const resolveAllowedToolNames = (context: ToolPermissionContext = {}): ReadonlySet<string> => {
  const profile = context.profile ?? AgentRole.SALES;
  const requestedTools = context.enabledTools ?? DEFAULT_TOOLS_BY_PROFILE[profile];
  const allowedTools = requestedTools.filter((name) => ALL_TOOL_NAMES.has(name));

  return new Set(
    allowedTools.filter((name) => name !== ToolName.QUERY_MONGODB || context.isFromCrm === true),
  );
};
