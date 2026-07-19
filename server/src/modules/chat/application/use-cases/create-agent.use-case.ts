import { z } from "zod";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import {
  IAgentRepository,
  IAgent,
  makeAgent,
  AgentStatus,
  AgentRole,
  AgentTool,
} from "../repositories/agent.repository.js";

export const CreateAgentInputSchema = z.object({
  name: z.string().min(1, "Name must not be empty"),
  systemPrompt: z.string().min(1, "System prompt must not be empty"),
  status: z.nativeEnum(AgentStatus).optional(),
  role: z.nativeEnum(AgentRole).optional(),
  enabledTools: z.array(z.nativeEnum(AgentTool)).optional(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

export type CreateAgent = UseCase<CreateAgentInput, IAgent, DomainError>;

export const makeCreateAgent = (
  agentRepository: IAgentRepository
): CreateAgent => {
  return async (input: CreateAgentInput) => {
    const parseResult = CreateAgentInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    try {
      const agent = makeAgent({
        name: input.name,
        systemPrompt: input.systemPrompt,
        status: input.status,
        role: input.role,
        enabledTools: input.enabledTools,
      });

      const systemActorId = IdVO.generateNil();
      const createRes = await agentRepository.create(agent, systemActorId);

      if (createRes.isFailure) {
        return Result.fail(createRes.getError());
      }

      return Result.ok<IAgent, DomainError>(createRes.getValue());
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to create agent"
        )
      );
    }
  };
};

export default makeCreateAgent;
