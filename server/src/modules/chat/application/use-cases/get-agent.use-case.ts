import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { createNotFoundError, createDomainError, DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { IAgentRepository, IAgent } from "../repositories/agent.repository.js";

export type GetAgentInput = { id: string };

export type GetAgent = UseCase<GetAgentInput, IAgent, DomainError>;

export const makeGetAgent = (agentRepository: IAgentRepository): GetAgent => {
  return async (input: GetAgentInput) => {
    try {
      const agentId = IdVO.create(input.id);
      const res = await agentRepository.getById(agentId);

      if (res.isFailure) {
        return Result.fail(res.getError());
      }

      const agent = res.getValue();
      if (!agent) {
        return Result.fail(createNotFoundError(`Agent with ID ${input.id} not found`));
      }

      return Result.ok<IAgent, DomainError>(agent);
    } catch (error) {
      return Result.fail(
        createDomainError(
          error instanceof Error ? error.message : "Failed to retrieve agent"
        )
      );
    }
  };
};

export default makeGetAgent;
