import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { ChatSessionStatus } from "../repositories/chat-session.repository.js";

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
}

export interface IWhatsAppGateway {
  sendMessage(
    to: string,
    text: string,
    options?: { alreadySaved?: boolean; messageId?: string }
  ): Promise<Result<void, Error>>;
}

export interface IExtractedClient {
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  address?: string | null;
}

export interface IExtractedCartItem {
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  price?: number | null;
}

export interface IExtractedData {
  client?: IExtractedClient | null;
  cart?: IExtractedCartItem[] | null;
}

export interface ILlmAdapter {
  generateResponse(
    from: string,
    text: string,
    history: Array<{ role: string; text: string }>,
    options?: {
      isFromCrm?: boolean;
      isOutOfHours?: boolean;
      systemPrompt?: string;
      enabledTools?: string[];
      historicalSummary?: string | null;
    }
  ): Promise<Result<{ reply: string; isDrift: boolean; extractedData?: IExtractedData | null }, DomainError>>;
  compactMemory(
    previousSummary: string | null | undefined,
    historyText: string
  ): Promise<Result<string, DomainError>>;
}

export interface ProcessIncomingMessageInput {
  from: string;
  text: string;
  alreadySaved?: boolean;
}

export interface ProcessIncomingMessageOutput {
  sessionId: string;
  status: ChatSessionStatus;
  driftCount: number;
}

export type ProcessIncomingMessage = UseCase<
  ProcessIncomingMessageInput,
  ProcessIncomingMessageOutput,
  DomainError
>;
