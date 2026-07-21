import { BaseRepository } from "../../../../../../shared-domain/src/shared/repository.js";
import { Id, IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString, NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { DateTime, DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";

export const AgentStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const AgentRole = {
  SALES: "SALES",
  SUPPORT: "SUPPORT",
  CRM_OPERATOR: "CRM_OPERATOR",
  LIBRARIAN: "LIBRARIAN",
} as const;

export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

export const AgentTool = {
  SEARCH_STOCK: "searchStock",
  CALCULATE_DELIVERY_FEE: "calculateDeliveryFee",
  CREATE_CLIENT: "createClient",
  CREATE_ORDER: "createOrder",
  QUERY_MONGO_DB: "queryMongoDB",
  WEB_FETCH: "webFetch",
  NAVIGATE_KNOWLEDGE_BRAIN: "navigateKnowledgeBrain",
  CREATE_KNOWLEDGE_ENTRY: "createKnowledgeEntry",
} as const;

export type AgentTool = (typeof AgentTool)[keyof typeof AgentTool];

export interface IAgent {
  id?: Id;
  name: NonEmptyString;
  systemPrompt: NonEmptyString;
  status: AgentStatus;
  role: AgentRole;
  enabledTools: AgentTool[];
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export const makeAgent = (props: {
  id?: string;
  name: string;
  systemPrompt: string;
  status?: string;
  role?: string;
  enabledTools?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}): IAgent => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    systemPrompt: NonEmptyStringVO.create(props.systemPrompt),
    status: (props.status ?? AgentStatus.ACTIVE) as AgentStatus,
    role: (props.role ?? AgentRole.SALES) as AgentRole,
    enabledTools: (props.enabledTools ?? []) as AgentTool[],
    createdAt: props.createdAt ? DateTimeVO.create(props.createdAt) : undefined,
    updatedAt: props.updatedAt ? DateTimeVO.create(props.updatedAt) : undefined,
  };
};

export interface IAgentRepository extends BaseRepository<IAgent> {}

export default IAgentRepository;
