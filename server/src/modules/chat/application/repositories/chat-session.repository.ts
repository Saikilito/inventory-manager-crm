import { BaseRepository } from "../../../../../../shared-domain/src/shared/repository.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Id, IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString, NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { DateTime, DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";

export const ChatSessionStatus = {
  BOT: "BOT",
  PENDING_HUMAN: "PENDING_HUMAN",
  HUMAN: "HUMAN",
} as const;

export type ChatSessionStatus =
  (typeof ChatSessionStatus)[keyof typeof ChatSessionStatus];

export interface IExtractedClient {
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  address?: string | null;
}

export interface IExtractedCartItem {
  productId?: Id | null;
  productName?: string | null;
  quantity?: number | null;
  price?: number | null;
}

export interface IExtractedData {
  client?: IExtractedClient | null;
  cart?: IExtractedCartItem[] | null;
}

export interface IChatSession {
  id?: Id;
  whatsappId: NonEmptyString;
  status: ChatSessionStatus;
  driftCount: number;
  assignedUserId?: Id | null;
  assignedAgentId?: Id | null;
  contactName?: NonEmptyString | null;
  extractedData?: IExtractedData | null;
  tags?: string[];
  historicalSummary?: string | null;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export const makeChatSession = (props: {
  id?: string;
  whatsappId: string;
  status: string;
  driftCount: number;
  assignedUserId?: string | null;
  assignedAgentId?: string | null;
  contactName?: string | null;
  extractedData?: {
    client?: {
      firstName?: string | null;
      lastName?: string | null;
      nationalId?: string | null;
      address?: string | null;
    } | null;
    cart?: {
      productId?: string | null;
      productName?: string | null;
      quantity?: number | null;
      price?: number | null;
    }[] | null;
  } | null;
  tags?: string[];
  historicalSummary?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}): IChatSession => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    whatsappId: NonEmptyStringVO.create(props.whatsappId),
    status: props.status as ChatSessionStatus,
    driftCount: props.driftCount,
    assignedUserId: props.assignedUserId
      ? IdVO.create(props.assignedUserId)
      : null,
    assignedAgentId: props.assignedAgentId
      ? IdVO.create(props.assignedAgentId)
      : null,
    contactName: props.contactName
      ? NonEmptyStringVO.create(props.contactName)
      : null,
    extractedData: props.extractedData
      ? {
          client: props.extractedData.client
            ? {
                firstName: props.extractedData.client.firstName,
                lastName: props.extractedData.client.lastName,
                nationalId: props.extractedData.client.nationalId,
                address: props.extractedData.client.address,
              }
            : null,
          cart: props.extractedData.cart
            ? props.extractedData.cart.map((item) => ({
                productId: item.productId ? IdVO.create(item.productId) : null,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
              }))
            : [],
        }
      : null,
    tags: props.tags || [],
    historicalSummary: props.historicalSummary ?? null,
    createdAt: props.createdAt ? DateTimeVO.create(props.createdAt) : undefined,
    updatedAt: props.updatedAt ? DateTimeVO.create(props.updatedAt) : undefined,
  };
};

export interface IChatSessionRepository extends BaseRepository<IChatSession> {
  updateStatus(
    whatsappId: NonEmptyString,
    status: ChatSessionStatus,
    updatedBy: Id
  ): Promise<Result<void, DatabaseError>>;
  updateDrift(
    whatsappId: NonEmptyString,
    driftCount: number,
    updatedBy: Id
  ): Promise<Result<void, DatabaseError>>;
  getOrCreate(
    whatsappId: NonEmptyString,
    createdBy: Id
  ): Promise<Result<IChatSession, DatabaseError>>;
}
export default IChatSessionRepository;
