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
} as const;

export type MongoCollectionNames = (typeof MongoCollectionNames)[keyof typeof MongoCollectionNames];

export const MongoQueryConstants = {
  MAX_PAGE_LIMIT: 100000,
  DEFAULT_PAGE_LIMIT: 1000,
} as const;

export type MongoQueryConstants = (typeof MongoQueryConstants)[keyof typeof MongoQueryConstants];
