import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { IAgentRepository, IAgent } from "../repositories/agent.repository.js";

export interface GetAgentsInput {
  limit?: number;
  offset?: number;
}

export type GetAgents = UseCase<GetAgentsInput, IAgent[], DomainError>;

export const makeGetAgents = (agentRepository: IAgentRepository): GetAgents => {
  return async (input: GetAgentsInput) => {
    try {
      const limitNum = input.limit ?? 100;
      const offsetNum = input.offset ?? 0;
      const pageNum = Math.floor(offsetNum / limitNum) + 1;

      const res = await agentRepository.getAll({
        limit: PositiveNumberVO.create(limitNum),
        page: PositiveNumberVO.create(pageNum),
      });

      if (res.isFailure) {
        return Result.fail(res.getError());
      }

      return Result.ok<IAgent[], DomainError>(res.getValue().items);
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to retrieve agents"
        )
      );
    }
  };
};

export default makeGetAgents;
