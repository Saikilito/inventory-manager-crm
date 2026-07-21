export const GeminiConstants = {
  MAX_COMPACTION_WORDS: 150,
  MAX_REPLY_WORDS: 50,
} as const;

export type GeminiConstants = (typeof GeminiConstants)[keyof typeof GeminiConstants];

export const MongoCollectionNames = {
  Products: "Product",
  Clients: "Client",
  Orders: "Order",
  Expenses: "Expense",
  FinancialDays: "FinancialDay",
  ChatSessions: "ChatSession",
  UnsatisfiedDemands: "UnsatisfiedDemand",
  Knowledge: "Knowledge",
  Contexts: "Context",
} as const;

export type MongoCollectionNames = (typeof MongoCollectionNames)[keyof typeof MongoCollectionNames];

export const MongoQueryConstants = {
  MAX_PAGE_LIMIT: 100000,
  DEFAULT_PAGE_LIMIT: 1000,
  QUERY_TOOL_RESULT_LIMIT: 50,
} as const;

export type MongoQueryConstants = (typeof MongoQueryConstants)[keyof typeof MongoQueryConstants];

const ProductsAllowedFields = [
  "name",
  "category",
  "stock",
  "price",
  "status",
  "contextId",
  "customAttributes.motoBrand",
  "customAttributes.partBrand",
  "createdAt",
  "updatedAt",
] as const;

const ClientsAllowedFields = [
  "firstName",
  "lastName",
  "whatsapp",
  "nationalId",
  "address",
  "sellerId",
  "rating",
  "tier",
  "createdAt",
  "updatedAt",
] as const;

const OrdersAllowedFields = [
  "status",
  "clientId",
  "sellerId",
  "contextId",
  "total",
  "createdAt",
  "updatedAt",
] as const;

const ExpensesAllowedFields = [
  "amount",
  "category",
  "date",
  "sellerId",
  "contextId",
  "createdAt",
] as const;

const FinancialDaysAllowedFields = [
  "date",
  "status",
  "openedBy",
  "closedBy",
  "createdAt",
  "closedAt",
] as const;

const ChatSessionsAllowedFields = [
  "whatsappId",
  "status",
  "driftCount",
  "assignedUserId",
  "assignedAgentId",
  "tags",
  "createdAt",
  "updatedAt",
] as const;

const UnsatisfiedDemandsAllowedFields = [
  "productId",
  "clientPhone",
  "productName",
  "quantity",
  "date",
  "status",
  "createdAt",
  "updatedAt",
] as const;

const KnowledgeAllowedFields = [
  "category",
  "title",
  "content",
  "status",
  "isActive",
  "createdAt",
  "updatedAt",
  "metadata.tags",
  "metadata.hierarchyLevel",
] as const;

const ContextsAllowedFields = [
  "name",
  "attributes.name",
  "attributes.label",
  "attributes.type",
  "attributes.required",
] as const;

const AllowedAggregateStages = [
  "$match",
  "$group",
  "$project",
  "$sort",
  "$limit",
  "$count",
  "$sum",
  "$avg",
  "$min",
  "$max",
  "$first",
  "$last",
  "$cond",
  "$ifNull",
  "$eq",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$and",
  "$or",
  "$not",
] as const;

export const MongoQueryToolAllowlist = {
  Products: ProductsAllowedFields,
  Clients: ClientsAllowedFields,
  Orders: OrdersAllowedFields,
  Expenses: ExpensesAllowedFields,
  FinancialDays: FinancialDaysAllowedFields,
  ChatSessions: ChatSessionsAllowedFields,
  UnsatisfiedDemands: UnsatisfiedDemandsAllowedFields,
  Knowledge: KnowledgeAllowedFields,
  Contexts: ContextsAllowedFields,
  AllowedAggregateStages,
} as const;

export type MongoQueryToolAllowlist =
  (typeof MongoQueryToolAllowlist)[keyof typeof MongoQueryToolAllowlist];
