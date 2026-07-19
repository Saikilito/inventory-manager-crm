export const ChatThreadStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type ChatThreadStatus = (typeof ChatThreadStatus)[keyof typeof ChatThreadStatus];
