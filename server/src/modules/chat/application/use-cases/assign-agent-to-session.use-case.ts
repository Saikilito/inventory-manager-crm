import { z } from "zod";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError, NotFoundError } from "../../../../../../shared-domain/src/shared/errors.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { WhatsappIdVO } from "../../../../../../shared-domain/src/shared/value-objects/whatsapp-id.vo.js";
import { IChatSessionRepository, IChatSession } from "../repositories/chat-session.repository.js";
import { IAgentRepository } from "../repositories/agent.repository.js";

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
}

export const AssignAgentToSessionInputSchema = z.object({
  whatsappId: z.string().refine((v) => !WhatsappIdVO.createResult(v).isFailure, "Invalid whatsappId format"),
  agentId: z.string().nullable(),
});

export type AssignAgentToSessionInput = z.infer<typeof AssignAgentToSessionInputSchema>;

export type AssignAgentToSession = UseCase<AssignAgentToSessionInput, IChatSession, DomainError>;

export const makeAssignAgentToSession = (dependencies: {
  chatSessionRepository: IChatSessionRepository;
  agentRepository: IAgentRepository;
  pubSub: IPubSub;
}): AssignAgentToSession => {
  return async (input: AssignAgentToSessionInput) => {
    const parseResult = AssignAgentToSessionInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    try {
      const whatsappIdVO = NonEmptyStringVO.create(input.whatsappId);

      const sessionRes = await dependencies.chatSessionRepository.getOne([
        {
          field: NonEmptyStringVO.create("whatsappId"),
          value: whatsappIdVO,
        },
      ]);

      if (sessionRes.isFailure) {
        return Result.fail(sessionRes.getError());
      }

      const session = sessionRes.getValue();
      if (!session) {
        return Result.fail(new NotFoundError(`Chat session not found for whatsappId ${input.whatsappId}`));
      }

      let agentIdVO = null;
      if (input.agentId !== null) {
        agentIdVO = IdVO.create(input.agentId);
        const agentRes = await dependencies.agentRepository.getById(agentIdVO);
        if (agentRes.isFailure) {
          return Result.fail(agentRes.getError());
        }
        const agent = agentRes.getValue();
        if (!agent) {
          return Result.fail(new NotFoundError(`Agent with ID ${input.agentId} not found`));
        }

        if (agent.role !== "SALES") {
          return Result.fail(
            new ValidationError("Only agents with role SALES can be assigned to live chat sessions")
          );
        }
      }

      const systemActorId = IdVO.generateNil();

      const updateRes = await dependencies.chatSessionRepository.updateById(
        session.id!,
        {
          assignedAgentId: agentIdVO,
        },
        systemActorId
      );

      if (updateRes.isFailure) {
        return Result.fail(updateRes.getError());
      }

      const updatedSessionRes = await dependencies.chatSessionRepository.getById(session.id!);
      if (updatedSessionRes.isFailure) {
        return Result.fail(updatedSessionRes.getError());
      }

      const updatedSession = updatedSessionRes.getValue();
      if (!updatedSession) {
        return Result.fail(new NotFoundError(`Failed to reload chat session`));
      }

      const eventPayload = {
        chatSessionUpdated: {
          id: updatedSession.id?.toString(),
          _id: updatedSession.id?.toString(),
          whatsappId: updatedSession.whatsappId.toString(),
          status: updatedSession.status,
          driftCount: updatedSession.driftCount,
          assignedUserId: updatedSession.assignedUserId?.toString() || null,
          assignedAgentId: updatedSession.assignedAgentId?.toString() || null,
          extractedData: updatedSession.extractedData || null,
          createdAt: updatedSession.createdAt?.toString() || new Date().toISOString(),
          updatedAt: updatedSession.updatedAt?.toString() || new Date().toISOString(),
        },
      };

      await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", eventPayload);

      return Result.ok<IChatSession, DomainError>(updatedSession);
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to assign agent to session"
        )
      );
    }
  };
};

export default makeAssignAgentToSession;
