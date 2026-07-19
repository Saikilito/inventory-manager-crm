import { BaseRepository } from "../../../../../../shared-domain/src/shared/repository.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DatabaseError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Id, IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString, NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";

export interface IBaileysAuth {
  id?: Id;
  sessionId: NonEmptyString;
  creds: Record<string, unknown>;
  keys: Record<string, unknown>;
}

export const makeBaileysAuth = (props: {
  id?: string;
  sessionId: string;
  creds: Record<string, unknown>;
  keys?: Record<string, unknown>;
}): IBaileysAuth => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    sessionId: NonEmptyStringVO.create(props.sessionId),
    creds: props.creds || {},
    keys: props.keys || {},
  };
};

export interface IBaileysAuthRepository extends BaseRepository<IBaileysAuth> {
  getBySessionId(
    sessionId: NonEmptyString
  ): Promise<Result<IBaileysAuth | null, DatabaseError>>;
  upsertAuth(
    sessionId: NonEmptyString,
    creds: Record<string, unknown>,
    keys: Record<string, unknown>,
    actorId: Id
  ): Promise<Result<void, DatabaseError>>;
  deleteBySessionId(
    sessionId: NonEmptyString
  ): Promise<Result<void, DatabaseError>>;
}

export default IBaileysAuthRepository;
