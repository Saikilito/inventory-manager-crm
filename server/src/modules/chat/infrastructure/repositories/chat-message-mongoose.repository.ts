import mongoose, { FilterQuery } from "mongoose";
import {
  IChatMessageRepository,
  IChatMessage,
  IChatThread,
  ChatMessageSender,
} from "../../application/repositories/chat-message.repository.js";
import { ChatThreadStatus } from "../../application/repositories/chat-thread-status.js";
import { ChatThreadModel, IChatThreadDocument } from "../chat-thread.model.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { createDatabaseError, DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { doTryResult } from "../../../../../../shared-domain/src/shared/do-try-result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString, NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import { CreateEntityInput, UpdateEntityInput, GetAllInput, WhereField, IShared } from "../../../../../../shared-domain/src/shared/repository.js";
import { getCaracasDateStr } from "../../application/use-cases/process-incoming-message.utils.js";

export const makeChatMessageMongooseRepository = (): IChatMessageRepository => {
  return {
    create: (async (
      input: CreateEntityInput<IChatMessage> | CreateEntityInput<IChatMessage>[],
      createdBy: IShared.VO.Id
    ): Promise<Result<IChatMessage | IChatMessage[], DatabaseError>> => {
      return doTryResult(
        async () => {
          const inputs = Array.isArray(input) ? input : [input];
          const results: IChatMessage[] = [];

          for (const item of inputs) {
            const dateStr = getCaracasDateStr();
            const msgId = new mongoose.Types.ObjectId();

            const msgSubDoc = {
              _id: msgId,
              text: item.text.toString(),
              sender: item.sender,
              isPrivate: item.isPrivate ?? false,
              createdBy: createdBy.toString(),
              updatedBy: createdBy.toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await ChatThreadModel.findOneAndUpdate(
              { whatsappId: item.whatsappId.toString(), dateStr },
              {
                $push: { messages: msgSubDoc },
                $setOnInsert: { status: ChatThreadStatus.ACTIVE },
              },
              {
                upsert: true,
                new: true,
              }
            ).exec();

            results.push({
              id: IdVO.create(msgId.toString()),
              whatsappId: item.whatsappId,
              text: item.text,
              sender: item.sender,
              isPrivate: item.isPrivate ?? false,
              createdAt: DateTimeVO.create(msgSubDoc.createdAt),
              updatedAt: DateTimeVO.create(msgSubDoc.updatedAt),
            });
          }

          if (Array.isArray(input)) {
            return results;
          }
          return results[0];
        },
        (err) => createDatabaseError(err.message)
      );
    }) as IChatMessageRepository["create"],

    getMessagesByWhatsappId: async (whatsappId: NonEmptyString) =>
      doTryResult(
        async () => {
          const threads = await ChatThreadModel.find({
            whatsappId: whatsappId.toString(),
          })
            .sort({ dateStr: 1 })
            .exec();

          const messages: IChatMessage[] = [];
          for (const thread of threads) {
            for (const msg of thread.messages) {
              messages.push({
                id: IdVO.create(msg._id ? msg._id.toString() : new mongoose.Types.ObjectId().toString()),
                whatsappId: NonEmptyStringVO.create(thread.whatsappId),
                text: NonEmptyStringVO.create(msg.text),
                sender: msg.sender as ChatMessageSender,
                isPrivate: msg.isPrivate ?? false,
                createdAt: DateTimeVO.create(msg.createdAt),
                updatedAt: DateTimeVO.create(msg.updatedAt),
              });
            }
          }
          return messages;
        },
        (err) => createDatabaseError(err.message)
      ),

    getAll: async <R = IChatMessage>(input?: GetAllInput): Promise<Result<IShared.PaginatedResult<R>, DatabaseError>> =>
      doTryResult(
        async () => {
          const page = input?.page ? Number(input.page) : 1;
          const limit = input?.limit ? Number(input.limit) : 10;
          const skip = (page - 1) * limit;

          let whatsappIdFilter: string | null = null;
          if (input?.where?.fields) {
            for (const field of input.where.fields) {
              if (field.field.toString() === "whatsappId") {
                whatsappIdFilter = field.value?.toString() ?? null;
              }
            }
          }

          const query: FilterQuery<IChatThreadDocument> = {};
          if (whatsappIdFilter) {
            query.whatsappId = whatsappIdFilter;
          }

          const threads = await ChatThreadModel.find(query)
            .sort({ dateStr: 1 })
            .exec();

          const allMessages: IChatMessage[] = [];
          for (const thread of threads) {
            for (const msg of thread.messages) {
              allMessages.push({
                id: IdVO.create(msg._id ? msg._id.toString() : new mongoose.Types.ObjectId().toString()),
                whatsappId: NonEmptyStringVO.create(thread.whatsappId),
                text: NonEmptyStringVO.create(msg.text),
                sender: msg.sender as ChatMessageSender,
                isPrivate: msg.isPrivate ?? false,
                createdAt: DateTimeVO.create(msg.createdAt),
                updatedAt: DateTimeVO.create(msg.updatedAt),
              });
            }
          }

          const total = allMessages.length;
          const items: R[] = allMessages.slice(skip, skip + limit) as R[];
          const pages = Math.ceil(total / limit);

          return {
            items,
            total,
            page,
            limit,
            pages,
          };
        },
        (err) => createDatabaseError(err.message)
      ),

    getActiveThreads: async (whatsappId: NonEmptyString) =>
      doTryResult(
        async () => {
          const threads = await ChatThreadModel.find({
            whatsappId: whatsappId.toString(),
            status: ChatThreadStatus.ACTIVE,
          })
            .sort({ dateStr: 1 })
            .exec();
          return threads.map((thread): IChatThread => ({
            id: IdVO.create(thread._id.toString()),
            whatsappId: NonEmptyStringVO.create(thread.whatsappId),
            dateStr: thread.dateStr,
            status: thread.status,
            messages: thread.messages.map((msg: IChatThreadDocument["messages"][number]) => ({
              text: msg.text,
              sender: msg.sender as ChatMessageSender,
              isPrivate: msg.isPrivate ?? false,
              createdAt: DateTimeVO.create(msg.createdAt),
              updatedAt: DateTimeVO.create(msg.updatedAt),
            })),
          }));
        },
        (err) => createDatabaseError(err.message)
      ),

    archiveThreads: async (whatsappId: NonEmptyString, dateStrs: string[]) =>
      doTryResult(
        async () => {
          await ChatThreadModel.updateMany(
            {
              whatsappId: whatsappId.toString(),
              dateStr: { $in: dateStrs },
            },
            {
              $set: { status: ChatThreadStatus.ARCHIVED },
            }
          ).exec();
        },
        (err) => createDatabaseError(err.message)
      ),

    getOne: async <R = IChatMessage>(_where: WhereField[]): Promise<Result<R | null, DatabaseError>> => {
      return Result.fail(createDatabaseError("getOne is not implemented on ChatMessageMongooseRepository"));
    },

    getById: async <R = IChatMessage>(_id: IShared.VO.Id, _relations?: IShared.VO.NonEmptyString[]): Promise<Result<R | null, DatabaseError>> => {
      return Result.fail(createDatabaseError("getById is not implemented on ChatMessageMongooseRepository"));
    },

    updateById: async (_id: IShared.VO.Id, _input: UpdateEntityInput<IChatMessage>, _updatedBy: IShared.VO.Id): Promise<Result<void, DatabaseError>> => {
      return Result.fail(createDatabaseError("updateById is not implemented on ChatMessageMongooseRepository"));
    },

    updateByIdIf: async (_id: IShared.VO.Id, _where: Partial<Record<keyof IChatMessage, unknown>>, _input: UpdateEntityInput<IChatMessage>, _updatedBy: IShared.VO.Id): Promise<Result<boolean, DatabaseError>> => {
      return Result.fail(createDatabaseError("updateByIdIf is not implemented on ChatMessageMongooseRepository"));
    },

    deleteByIds: async (_ids: IShared.VO.Id[], _deletedBy: IShared.VO.Id): Promise<Result<void, DatabaseError>> => {
      return Result.fail(createDatabaseError("deleteByIds is not implemented on ChatMessageMongooseRepository"));
    },
  };
};

export default makeChatMessageMongooseRepository;
