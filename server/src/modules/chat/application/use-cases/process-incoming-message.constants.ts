export const ChatSessionTag = {
  OrderCompleted: "ORDER COMPLETED",
  Cancelled: "CANCELLED",
} as const;

export type ChatSessionTag = (typeof ChatSessionTag)[keyof typeof ChatSessionTag];
