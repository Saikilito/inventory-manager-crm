import mongoose from "mongoose";
import {
  IChatSessionRepository,
  IChatSession,
  makeChatSession,
  ChatSessionStatus,
} from "../../application/repositories/chat-session.repository.js";
import {
  ChatSessionModel,
  IChatSessionDocument,
} from "../chat-session.model.js";
import { makeMongooseBaseRepository } from "../../../shared/infrastructure/repositories/mongoose-base.repository.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { doTryResult } from "../../../../../../shared-domain/src/shared/do-try-result.js";
import { NonEmptyString } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { Id } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";

const mapToDomain = (doc: IChatSessionDocument): IChatSession => {
  return makeChatSession({
    id: doc._id.toString(),
    whatsappId: doc.whatsappId,
    status: doc.status,
    driftCount: doc.driftCount,
    assignedUserId: doc.assignedUserId ? doc.assignedUserId.toString() : null,
    assignedAgentId: doc.assignedAgentId ? doc.assignedAgentId.toString() : null,
    contactName: doc.contactName ?? null,
    extractedData: doc.extractedData
      ? {
          client: doc.extractedData.client
            ? {
                firstName: doc.extractedData.client.firstName,
                lastName: doc.extractedData.client.lastName,
                nationalId: doc.extractedData.client.nationalId,
                address: doc.extractedData.client.address,
              }
            : null,
          cart: doc.extractedData.cart
            ? doc.extractedData.cart.map((item) => ({
                productId: item.productId ? item.productId.toString() : null,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
              }))
            : [],
        }
      : null,
    tags: doc.tags,
    historicalSummary: doc.historicalSummary ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

export const makeChatSessionMongooseRepository = (): IChatSessionRepository => {
  const base = makeMongooseBaseRepository<IChatSession, IChatSessionDocument>({
    model: ChatSessionModel,
    mapToDomain,
    mapToDocumentData: (session) => {
      const data: Partial<IChatSessionDocument> = {};
      if (session.whatsappId !== undefined) {
        data.whatsappId = session.whatsappId.toString();
      }
      if (session.status !== undefined) {
        data.status = session.status;
      }
      if (session.driftCount !== undefined) {
        data.driftCount = session.driftCount;
      }
      if (session.assignedUserId !== undefined) {
        data.assignedUserId = session.assignedUserId
          ? (new mongoose.Types.ObjectId(
              session.assignedUserId.toString()
            ) as IChatSessionDocument["assignedUserId"])
          : null;
      }
      if (session.assignedAgentId !== undefined) {
        data.assignedAgentId = session.assignedAgentId
          ? (new mongoose.Types.ObjectId(
              session.assignedAgentId.toString()
            ) as IChatSessionDocument["assignedAgentId"])
          : null;
      }
      if (session.contactName !== undefined) {
        data.contactName = session.contactName
          ? session.contactName.toString()
          : null;
      }
      if (session.extractedData !== undefined) {
        data.extractedData = session.extractedData
          ? {
              client: session.extractedData.client
                ? {
                    firstName: session.extractedData.client.firstName ?? null,
                    lastName: session.extractedData.client.lastName ?? null,
                    nationalId: session.extractedData.client.nationalId ?? null,
                    address: session.extractedData.client.address ?? null,
                  }
                : null,
              cart: session.extractedData.cart
                ? session.extractedData.cart.map((item: NonNullable<NonNullable<IChatSession["extractedData"]>["cart"]>[number]) => ({
                    productId: item.productId
                      ? (new mongoose.Types.ObjectId(
                          item.productId.toString()
                        ) as NonNullable<
                          NonNullable<
                            IChatSessionDocument["extractedData"]
                          >["cart"]
                        >[number]["productId"])
                      : null,
                    productName: item.productName ?? null,
                    quantity: item.quantity ?? null,
                    price: item.price ?? null,
                  }))
                : [],
            }
          : null;
      }
      if (session.tags !== undefined) {
        data.tags = session.tags;
      }
      if (session.historicalSummary !== undefined) {
        data.historicalSummary = session.historicalSummary;
      }
      return data;
    },
  });

  return {
    ...base,
    updateStatus: async (
      whatsappId: NonEmptyString,
      status: ChatSessionStatus,
      updatedBy: Id
    ): Promise<Result<void, DatabaseError>> => {
      return doTryResult(
        async () => {
          await ChatSessionModel.findOneAndUpdate(
            { whatsappId: whatsappId.toString() },
            {
              $set: {
                status,
                updatedBy: updatedBy.toString(),
              },
            },
            { new: true }
          ).exec();
        },
        (err) => new DatabaseError(err.message)
      );
    },

    updateDrift: async (
      whatsappId: NonEmptyString,
      driftCount: number,
      updatedBy: Id
    ): Promise<Result<void, DatabaseError>> => {
      return doTryResult(
        async () => {
          await ChatSessionModel.findOneAndUpdate(
            { whatsappId: whatsappId.toString() },
            {
              $set: {
                driftCount,
                updatedBy: updatedBy.toString(),
              },
            },
            { new: true }
          ).exec();
        },
        (err) => new DatabaseError(err.message)
      );
    },

    getOrCreate: async (
      whatsappId: NonEmptyString,
      createdBy: Id
    ): Promise<Result<IChatSession, DatabaseError>> => {
      return doTryResult(
        async () => {
          let doc = await ChatSessionModel.findOne({
            whatsappId: whatsappId.toString(),
          }).exec();

          if (!doc) {
            doc = await ChatSessionModel.create({
              whatsappId: whatsappId.toString(),
              status: ChatSessionStatus.BOT,
              driftCount: 0,
              assignedUserId: null,
              assignedAgentId: null,
              extractedData: null,
              createdBy: createdBy.toString(),
              updatedBy: createdBy.toString(),
            });
          }

          return mapToDomain(doc);
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
};

export default makeChatSessionMongooseRepository;
