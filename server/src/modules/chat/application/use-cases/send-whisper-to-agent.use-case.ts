import { z } from "zod";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { WhatsappIdVO } from "../../../../../../shared-domain/src/shared/value-objects/whatsapp-id.vo.js";
import { IChatMessageRepository, IChatMessage, ChatMessageSender } from "../repositories/chat-message.repository.js";
import { IChatSessionRepository } from "../repositories/chat-session.repository.js";
import { ILlmAdapter } from "./process-incoming-message.use-case.js";

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
}

export const SendWhisperToAgentInputSchema = z.object({
  whatsappId: z.string().refine((v) => !WhatsappIdVO.createResult(v).isFailure, "Invalid whatsappId format"),
  text: z.string().min(1, "Text must not be empty"),
});

export type SendWhisperToAgentInput = z.infer<typeof SendWhisperToAgentInputSchema>;

export type SendWhisperToAgent = UseCase<SendWhisperToAgentInput, IChatMessage, DomainError>;

export const makeSendWhisperToAgent = (dependencies: {
  chatSessionRepository: IChatSessionRepository;
  chatMessageRepository: IChatMessageRepository;
  llmAdapter: ILlmAdapter;
  pubSub: IPubSub;
}): SendWhisperToAgent => {
  return async (input: SendWhisperToAgentInput) => {
    const parseResult = SendWhisperToAgentInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    try {
      const whatsappIdVO = NonEmptyStringVO.create(input.whatsappId);
      const systemActorId = IdVO.generateNil();

      const operatorMsgRes = await dependencies.chatMessageRepository.create(
        {
          whatsappId: whatsappIdVO,
          text: NonEmptyStringVO.create(input.text),
          sender: ChatMessageSender.CRM_OPERATOR,
          isPrivate: true,
        },
        systemActorId
      );

      if (operatorMsgRes.isFailure) {
        return Result.fail(operatorMsgRes.getError());
      }

      const savedOperatorMsg = operatorMsgRes.getValue();

      await dependencies.pubSub.publish(`CHAT_MESSAGE_RECEIVED_${input.whatsappId}`, {
        chatMessageReceived: {
          id: savedOperatorMsg.id!.toString(),
          _id: savedOperatorMsg.id!.toString(),
          text: savedOperatorMsg.text.toString(),
          sender: ChatMessageSender.CRM_OPERATOR,
          isPrivate: true,
          createdAt: savedOperatorMsg.createdAt!.toString(),
        },
      });

      const messagesRes = await dependencies.chatMessageRepository.getMessagesByWhatsappId(whatsappIdVO);
      if (messagesRes.isFailure) {
        return Result.fail(messagesRes.getError());
      }

      const dbMessages = messagesRes.getValue();
      const privateLogs = dbMessages.filter((m) => m.isPrivate === true);

      const historyMessages = privateLogs.slice(0, -1);
      const history = historyMessages.map((m) => ({
        role: m.sender === ChatMessageSender.CRM_OPERATOR ? "user" : "model",
        text: m.text.toString(),
      }));

      const llmRes = await dependencies.llmAdapter.generateResponse(
        input.whatsappId,
        input.text,
        history,
        { isFromCrm: true }
      );

      if (llmRes.isFailure) {
        return Result.fail(llmRes.getError());
      }

      const { reply } = llmRes.getValue();

      const botMsgRes = await dependencies.chatMessageRepository.create(
        {
          whatsappId: whatsappIdVO,
          text: NonEmptyStringVO.create(reply),
          sender: ChatMessageSender.BOT,
          isPrivate: true,
        },
        systemActorId
      );

      if (botMsgRes.isFailure) {
        return Result.fail(botMsgRes.getError());
      }

      const savedBotMsg = botMsgRes.getValue();

      await dependencies.pubSub.publish(`CHAT_MESSAGE_RECEIVED_${input.whatsappId}`, {
        chatMessageReceived: {
          id: savedBotMsg.id!.toString(),
          _id: savedBotMsg.id!.toString(),
          text: savedBotMsg.text.toString(),
          sender: ChatMessageSender.BOT,
          isPrivate: true,
          createdAt: savedBotMsg.createdAt!.toString(),
        },
      });

      return Result.ok<IChatMessage, DomainError>(savedBotMsg);
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Failed to send whisper to agent"
        )
      );
    }
  };
};

export default makeSendWhisperToAgent;
