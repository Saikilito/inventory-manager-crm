import mongoose from "mongoose";
import {
  IBaileysAuthRepository,
  IBaileysAuth,
  makeBaileysAuth,
} from "../../application/repositories/baileys-auth.repository.js";
import {
  BaileysCredsModel,
  BaileysKeyModel,
  IBaileysCredsDocument,
} from "../baileys-auth.model.js";
import { makeMongooseBaseRepository } from "../../../shared/infrastructure/repositories/mongoose-base.repository.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { doTryResult } from "../../../../../../shared-domain/src/shared/do-try-result.js";
import { NonEmptyString } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { Id } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";

const parseJsonSafe = (rawCreds: unknown): Record<string, unknown> =>
  typeof rawCreds === "string" ? (JSON.parse(rawCreds) as Record<string, unknown>) : (rawCreds as Record<string, unknown>);

const stringifyJsonSafe = (creds: unknown): string =>
  typeof creds === "string" ? creds : JSON.stringify(creds);

const mapToDomain = (doc: IBaileysCredsDocument): IBaileysAuth => {
  return makeBaileysAuth({
    id: doc._id.toString(),
    sessionId: doc.sessionId,
    creds: parseJsonSafe(doc.creds),
    keys: {},
  });
};

export const makeBaileysAuthMongooseRepository = (): IBaileysAuthRepository => {
  const base = makeMongooseBaseRepository<IBaileysAuth, IBaileysCredsDocument>({
    model: BaileysCredsModel,
    mapToDomain,
    mapToDocumentData: (auth) => {
      const data: Partial<IBaileysCredsDocument> = {};
      if (auth.sessionId !== undefined) {
        data.sessionId = auth.sessionId.toString();
      }
      if (auth.creds !== undefined) {
        data.creds = stringifyJsonSafe(auth.creds);
      }
      return data;
    },
  });

  return {
    ...base,
    getBySessionId: async (
      sessionId: NonEmptyString
    ): Promise<Result<IBaileysAuth | null, DatabaseError>> => {
      return doTryResult(
        async () => {
          const doc = await BaileysCredsModel.findOne({
            sessionId: sessionId.toString(),
          }).exec();
          if (!doc) return null;
          return mapToDomain(doc);
        },
        (err) => new DatabaseError(err.message)
      );
    },

    upsertAuth: async (
      sessionId: NonEmptyString,
      creds: Record<string, unknown>,
      keys: Record<string, unknown>,
      actorId: Id
    ): Promise<Result<void, DatabaseError>> => {
      return doTryResult(
        async () => {
          const credsStr = stringifyJsonSafe(creds);
          const keysStr = stringifyJsonSafe(keys);

          await BaileysCredsModel.findOneAndUpdate(
            { sessionId: sessionId.toString() },
            {
              $set: {
                creds: credsStr,
                keys: keysStr,
                updatedBy: actorId.toString(),
              },
              $setOnInsert: {
                createdBy: actorId.toString(),
              },
            },
            { upsert: true, new: true }
          ).exec();
        },
        (err) => new DatabaseError(err.message)
      );
    },

    deleteBySessionId: async (
      sessionId: NonEmptyString
    ): Promise<Result<void, DatabaseError>> => {
      return doTryResult(
        async () => {
          await BaileysCredsModel.deleteOne({
            sessionId: sessionId.toString(),
          }).exec();
          await BaileysKeyModel.deleteMany({
            sessionId: sessionId.toString(),
          }).exec();
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
};

export default makeBaileysAuthMongooseRepository;
