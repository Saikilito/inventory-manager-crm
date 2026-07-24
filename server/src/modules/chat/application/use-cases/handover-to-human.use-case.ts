import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { createNotFoundError, createDomainError, DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { IChatSessionRepository, ChatSessionStatus } from "../repositories/chat-session.repository.js";

export interface IWhatsAppGateway {
  sendMessage(to: string, text: string): Promise<Result<void, Error>>;
}

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
}

export type HandoverToHuman = UseCase<string, void, DomainError>;

export const makeHandoverToHuman = (dependencies: {
  chatSessionRepository: IChatSessionRepository;
  whatsAppGateway: IWhatsAppGateway;
  pubSub: IPubSub;
}): HandoverToHuman => {
  return async (whatsappIdStr: string) => {
    const whatsappId = NonEmptyStringVO.create(whatsappIdStr);

    const sessionRes = await dependencies.chatSessionRepository.getOne([
      {
        field: NonEmptyStringVO.create("whatsappId"),
        value: whatsappId,
      },
    ]);

    if (sessionRes.isFailure) {
      return Result.fail(sessionRes.getError());
    }

    const session = sessionRes.getValue();
    if (!session) {
      return Result.fail(
        createNotFoundError(
          `Chat session not found for WhatsApp ID: ${whatsappIdStr}`
        )
      );
    }

    if (!session.id) {
      return Result.fail(createDomainError("Chat session lacks an ID"));
    }

    const systemActorId = IdVO.generateNil();

    const updateRes = await dependencies.chatSessionRepository.updateById(
      session.id,
      {
        status: ChatSessionStatus.PENDING_HUMAN,
        assignedUserId: null,
        driftCount: 0,
      },
      systemActorId
    );

    if (updateRes.isFailure) {
      return Result.fail(updateRes.getError());
    }

    const alertGroupJid =
      process.env.WHATSAPP_ALERT_GROUP_JID || "123456789-987654@g.us";
    const alertMessage = `⚠️ [HUMAN ESCALATION] Support requested for customer: +${whatsappIdStr}. Chat session transitioned to PENDING_HUMAN.`;

    const gatewayRes = await dependencies.whatsAppGateway.sendMessage(
      alertGroupJid,
      alertMessage
    );

    if (gatewayRes.isFailure) {
      return Result.fail(
        createDomainError(
          `WhatsApp alert dispatch failed: ${gatewayRes.getError().message}`
        )
      );
    }

    const eventPayload = {
      chatSessionUpdated: {
        id: session.id.toString(),
        whatsappId: whatsappId.toString(),
        status: ChatSessionStatus.PENDING_HUMAN,
        assignedUserId: null,
        driftCount: 0,
        updatedAt: new Date().toISOString(),
      },
    };

    await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", eventPayload);

    return Result.ok<void, DomainError>();
  };
};

export default makeHandoverToHuman;
