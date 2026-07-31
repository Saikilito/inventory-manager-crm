import { BaseRepository } from "../../../../../../shared-domain/src/shared/repository.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Id } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { DateTime } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import { ChatThreadStatus } from "./chat-thread-status.js";

export const ChatMessageSender = {
  CUSTOMER: "CUSTOMER",
  BOT: "BOT",
  AGENT: "AGENT",
  CRM_OPERATOR: "CRM_OPERATOR",
} as const;

export type ChatMessageSender = (typeof ChatMessageSender)[keyof typeof ChatMessageSender];

export interface IChatMessage {
  id?: Id;
  whatsappId: NonEmptyString;
  text: NonEmptyString;
  sender: ChatMessageSender;
  isPrivate?: boolean;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface IChatThreadMessage {
  text: string;
  sender: ChatMessageSender;
  isPrivate: boolean;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface IChatThread {
  id?: Id;
  whatsappId: NonEmptyString;
  dateStr: string;
  status: ChatThreadStatus;
  messages: IChatThreadMessage[];
}

export interface IChatMessageRepository extends BaseRepository<IChatMessage> {
  getMessagesByWhatsappId(
    whatsappId: NonEmptyString
  ): Promise<Result<IChatMessage[], DatabaseError>>;
  getActiveThreads(
    whatsappId: NonEmptyString
  ): Promise<Result<IChatThread[], DatabaseError>>;
  archiveThreads(
    whatsappId: NonEmptyString,
    dateStrs: string[]
  ): Promise<Result<void, DatabaseError>>;
}

export default IChatMessageRepository;
