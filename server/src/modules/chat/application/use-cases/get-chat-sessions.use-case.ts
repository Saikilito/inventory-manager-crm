import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { IChatSessionRepository, IChatSession } from "../repositories/chat-session.repository.js";

export interface GetChatSessionsInput {
  limit?: number;
  offset?: number;
}

export type GetChatSessions = UseCase<GetChatSessionsInput, IChatSession[], DomainError>;

const DEFAULT_PAGE_SIZE = 1000;

export const makeGetChatSessions = (
  chatSessionRepository: IChatSessionRepository,
): GetChatSessions => {
  return async (input: GetChatSessionsInput) => {
    try {
      const limit = input.limit ?? DEFAULT_PAGE_SIZE;
      const offset = input.offset ?? 0;
      const page = Math.floor(offset / limit) + 1;

      const res = await chatSessionRepository.getAll({
        page: PositiveNumberVO.create(page),
        limit: PositiveNumberVO.create(limit),
        sort: { field: "updatedAt", direction: "DESC" },
      });

      if (res.isFailure) {
        return Result.fail(new DomainError(res.getError().message));
      }

      return Result.ok<IChatSession[], DomainError>(res.getValue().items);
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to retrieve chat sessions",
        ),
      );
    }
  };
};

export default makeGetChatSessions;
