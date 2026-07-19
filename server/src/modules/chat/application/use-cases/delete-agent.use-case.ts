import { z } from "zod";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError, NotFoundError } from "../../../../../../shared-domain/src/shared/errors.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { IAgentRepository } from "../repositories/agent.repository.js";

export const DeleteAgentInputSchema = z.object({
  id: z.string().min(1, "Agent ID is required"),
});

export type DeleteAgentInput = z.infer<typeof DeleteAgentInputSchema>;

export type DeleteAgent = UseCase<DeleteAgentInput, void, DomainError>;

export const makeDeleteAgent = (
  agentRepository: IAgentRepository
): DeleteAgent => {
  return async (input: DeleteAgentInput) => {
    const parseResult = DeleteAgentInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    try {
      const agentId = IdVO.create(input.id);
      const existingRes = await agentRepository.getById(agentId);

      if (existingRes.isFailure) {
        return Result.fail(existingRes.getError());
      }

      const existingAgent = existingRes.getValue();
      if (!existingAgent) {
        return Result.fail(new NotFoundError(`Agent with ID ${input.id} not found`));
      }

      const systemActorId = IdVO.generateNil();
      const deleteRes = await agentRepository.deleteByIds([agentId], systemActorId);

      if (deleteRes.isFailure) {
        return Result.fail(deleteRes.getError());
      }

      return Result.ok<void, DomainError>();
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to delete agent"
        )
      );
    }
  };
};

export default makeDeleteAgent;
