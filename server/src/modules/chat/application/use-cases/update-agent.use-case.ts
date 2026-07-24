import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { createNotFoundError, createDomainError, DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import {
  IAgentRepository,
  IAgent,
  makeAgent,
  AgentStatus,
  AgentRole,
  AgentTool,
} from '../repositories/agent.repository.js';

export const UpdateAgentInputSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Name must not be empty').optional(),
  systemPrompt: z.string().min(1, 'System prompt must not be empty').optional(),
  status: z.nativeEnum(AgentStatus).optional(),
  role: z.nativeEnum(AgentRole).optional(),
  enabledTools: z.array(z.nativeEnum(AgentTool)).optional(),
});

export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>;

export type UpdateAgent = UseCase<UpdateAgentInput, IAgent, DomainError>;

export const makeUpdateAgent = (agentRepository: IAgentRepository): UpdateAgent => {
  return async (input: UpdateAgentInput) => {
    const parseResult = UpdateAgentInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(createValidationError(parseResult.error.message));
    }

    try {
      const agentId = IdVO.create(input.id);
      const existingRes = await agentRepository.getById(agentId);

      if (existingRes.isFailure) {
        return Result.fail(existingRes.getError());
      }

      const existingAgent = existingRes.getValue();
      if (!existingAgent) {
        return Result.fail(createNotFoundError(`Agent with ID ${input.id} not found`));
      }

      const updateData: Partial<IAgent> = {};
      if (input.name !== undefined) {
        updateData.name = NonEmptyStringVO.create(input.name);
      }
      if (input.systemPrompt !== undefined) {
        updateData.systemPrompt = NonEmptyStringVO.create(input.systemPrompt);
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
      }
      if (input.role !== undefined) {
        updateData.role = input.role;
      }
      if (input.enabledTools !== undefined) {
        updateData.enabledTools = input.enabledTools;
      }

      const systemActorId = IdVO.generateNil();
      const updateRes = await agentRepository.updateById(agentId, updateData, systemActorId);

      if (updateRes.isFailure) {
        return Result.fail(updateRes.getError());
      }

      const updatedRes = await agentRepository.getById(agentId);
      if (updatedRes.isFailure) {
        return Result.fail(updatedRes.getError());
      }

      const updatedAgent = updatedRes.getValue();
      if (!updatedAgent) {
        return Result.fail(createNotFoundError(`Agent with ID ${input.id} not found after update`));
      }

      return Result.ok<IAgent, DomainError>(updatedAgent);
    } catch (error) {
      return Result.fail(createDomainError(error instanceof Error ? error.message : 'Failed to update agent'));
    }
  };
};

export default makeUpdateAgent;
