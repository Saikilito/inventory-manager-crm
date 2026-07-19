import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { WhatsappIdVO } from "../../../../../../shared-domain/src/shared/value-objects/whatsapp-id.vo.js";
import { CedulaVO } from "../../../../../../shared-domain/src/shared/value-objects/cedula.vo.js";
import { IChatSessionRepository, ChatSessionStatus } from "../repositories/chat-session.repository.js";
import { IChatMessageRepository, ChatMessageSender, IChatThread } from "../repositories/chat-message.repository.js";
import { IAgentRepository } from "../repositories/agent.repository.js";
import { IClientRepository } from "../../../client/application/repositories/client.repository.js";
import { CheckWorkingHours } from "./check-working-hours.use-case.js";
import { HandoverToHuman } from "./handover-to-human.use-case.js";
import { ChatSessionTag } from "./process-incoming-message.constants.js";
export type {
  IPubSub, IWhatsAppGateway, IExtractedClient, IExtractedCartItem,
  IExtractedData, ILlmAdapter, ProcessIncomingMessageInput,
  ProcessIncomingMessageOutput, ProcessIncomingMessage,
} from "./process-incoming-message.types.js";
import type {
  IPubSub, IWhatsAppGateway, ILlmAdapter,
  ProcessIncomingMessageInput, ProcessIncomingMessageOutput,
  ProcessIncomingMessage,
} from "./process-incoming-message.types.js";
export {
  splitMessageIntoChunks, getCaracasDateStr,
  potentialCedulaRegex,
} from "./process-incoming-message.utils.js";
import {
  splitMessageIntoChunks, getCaracasDateStr,
  potentialCedulaRegex,
} from "./process-incoming-message.utils.js";
export const makeProcessIncomingMessage = (dependencies: {
  chatSessionRepository: IChatSessionRepository;
  chatMessageRepository: IChatMessageRepository;
  agentRepository?: IAgentRepository;
  clientRepository: IClientRepository;
  whatsAppGateway: IWhatsAppGateway;
  llmAdapter: ILlmAdapter;
  checkWorkingHours: CheckWorkingHours;
  handoverToHuman: HandoverToHuman;
  pubSub?: IPubSub;
}): ProcessIncomingMessage => {
  return async (input: ProcessIncomingMessageInput) => {
    const phoneResult = WhatsappIdVO.createResult(input.from);
    if (phoneResult.isFailure) {
      return Result.fail(
        new ValidationError(
          `Invalid phone format: ${input.from}. Must be E.164 compliant (e.g., +12345678900)`
        )
      );
    }

    const matchedToken = input.text.match(potentialCedulaRegex);
    if (matchedToken) {
      const token = matchedToken[0];
      if (/^[vVeE]-?\d/.test(token)) {
        const prefix = token[0].toUpperCase();
        const numberPart = token.slice(1).replace(/^-/, "").replace(/\./g, "");
        const normalizedToken = `${prefix}-${numberPart}`;
        const cedulaResult = CedulaVO.createResult(normalizedToken);
        if (cedulaResult.isFailure) {
          return Result.fail(
            new ValidationError(
              `Invalid Cédula format: ${token}. Must match ^[VE]-\\d{7,9}$`
            )
          );
        }
      }
    }

    const systemActorId = IdVO.generateNil();

    const whatsappIdVO = NonEmptyStringVO.create(input.from);
    const sessionRes = await dependencies.chatSessionRepository.getOrCreate(
      whatsappIdVO,
      systemActorId
    );

    if (sessionRes.isFailure) {
      return Result.fail(sessionRes.getError());
    }

    const session = sessionRes.getValue();
    const sessionIdStr = session.id?.toString() || "";

    const activeThreadsRes = await dependencies.chatMessageRepository.getActiveThreads(whatsappIdVO);
    if (!activeThreadsRes.isFailure) {
      const activeThreads = activeThreadsRes.getValue();
      const todayDateStr = getCaracasDateStr();
      const todayThread = activeThreads.find((t: IChatThread) => t.dateStr === todayDateStr);
      const priorActiveThreads = activeThreads.filter((t: IChatThread) => t.dateStr !== todayDateStr);

      if (priorActiveThreads.length >= 3 && !todayThread) {
        const threadsToCompact = priorActiveThreads.slice(0, 3);
        let chatScriptText = "";
        for (const thread of threadsToCompact) {
          chatScriptText += `--- Fecha: ${thread.dateStr} ---\n`;
          for (const msg of thread.messages) {
            const roleName = msg.sender === ChatMessageSender.CUSTOMER ? "Cliente" : "Asistente";
            chatScriptText += `[${msg.createdAt ? new Date(msg.createdAt).toISOString() : ""}] ${roleName}: ${msg.text}\n`;
          }
        }

        const compactionRes = await dependencies.llmAdapter.compactMemory(
          session.historicalSummary,
          chatScriptText
        );

        if (!compactionRes.isFailure) {
          const newSummary = compactionRes.getValue();
          session.historicalSummary = newSummary;
          await dependencies.chatSessionRepository.updateById(
            session.id!,
            { historicalSummary: newSummary },
            systemActorId
          );

          const dateStrsToArchive = threadsToCompact.map((t: IChatThread) => t.dateStr);
          await dependencies.chatMessageRepository.archiveThreads(
            whatsappIdVO,
            dateStrsToArchive
          );
        }
      }
    }

    if (session.tags && (session.tags.includes(ChatSessionTag.OrderCompleted) || session.tags.includes(ChatSessionTag.Cancelled))) {
      session.tags = [];
      await dependencies.chatSessionRepository.updateById(
        session.id!,
        { tags: [] },
        systemActorId
      );
      if (dependencies.pubSub) {
        await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", {
          chatSessionUpdated: {
            id: session.id?.toString(),
            _id: session.id?.toString(),
            whatsappId: session.whatsappId.toString(),
            status: session.status,
            driftCount: session.driftCount,
            assignedUserId: session.assignedUserId?.toString() || null,
            assignedAgentId: session.assignedAgentId?.toString() || null,
            contactName: session.contactName?.toString() || null,
            extractedData: session.extractedData || null,
            tags: [],
            createdAt: session.createdAt?.toString() || new Date().toISOString(),
            updatedAt: session.updatedAt?.toString() || new Date().toISOString(),
          }
        });
      }
    }

    if (!input.alreadySaved) {
      const incomingMsgRes = await dependencies.chatMessageRepository.create(
        {
          whatsappId: whatsappIdVO,
          text: NonEmptyStringVO.create(input.text),
          sender: ChatMessageSender.CUSTOMER,
        },
        systemActorId
      );
      if (incomingMsgRes.isFailure) {
        return Result.fail(incomingMsgRes.getError());
      }
    }

    if (session.status !== ChatSessionStatus.BOT) {
      return Result.ok<ProcessIncomingMessageOutput, DomainError>({
        sessionId: sessionIdStr,
        status: session.status,
        driftCount: session.driftCount,
      });
    }

    const hoursResult = await dependencies.checkWorkingHours(new Date());
    if (hoursResult.isFailure) {
      return Result.fail(hoursResult.getError());
    }

    const isWithinHours = hoursResult.getValue();
    const isOutOfHours = !isWithinHours;
    const clientRes = await dependencies.clientRepository.getOne([
      {
        field: NonEmptyStringVO.create("whatsapp"),
        value: whatsappIdVO,
      },
    ]);

    if (clientRes.isFailure) {
      return Result.fail(clientRes.getError());
    }
    const historyRes = await dependencies.chatMessageRepository.getMessagesByWhatsappId(whatsappIdVO);
    let history: Array<{ role: string; text: string }> = [];
    if (!historyRes.isFailure) {
      const dbMessages = historyRes.getValue();
      const previousMessages = dbMessages.slice(0, -1);
      
      history = previousMessages.map((m) => ({
        role: m.sender === ChatMessageSender.CUSTOMER ? "user" : "model",
        text: m.text.toString(),
      }));
    }

    let systemPrompt: string | undefined;
    let enabledTools: string[] | undefined;
    if (session.assignedAgentId && dependencies.agentRepository) {
      const agentRes = await dependencies.agentRepository.getById(session.assignedAgentId);
      if (!agentRes.isFailure && agentRes.getValue()) {
        const agent = agentRes.getValue()!;
        systemPrompt = agent.systemPrompt.toString();
        enabledTools = agent.enabledTools;
      }
    }
    const llmRes = await dependencies.llmAdapter.generateResponse(
      input.from,
      input.text,
      history,
      {
        isOutOfHours,
        systemPrompt,
        enabledTools,
        historicalSummary: session.historicalSummary,
      }
    );

    if (llmRes.isFailure) {
      return Result.fail(llmRes.getError());
    }

    const { reply, isDrift, extractedData } = llmRes.getValue();
    if (extractedData) {
      let autoContactName: string | null = null;
      if (!session.contactName && extractedData.client?.firstName && extractedData.client?.lastName) {
        autoContactName = `${extractedData.client.firstName.trim()} ${extractedData.client.lastName.trim()}`;
        session.contactName = NonEmptyStringVO.create(autoContactName);
      }

      await dependencies.chatSessionRepository.updateById(
        session.id!,
        {
          ...(autoContactName ? { contactName: NonEmptyStringVO.create(autoContactName) } : {}),
          extractedData: {
            client: extractedData.client ? {
              firstName: extractedData.client.firstName || null,
              lastName: extractedData.client.lastName || null,
              nationalId: extractedData.client.nationalId || null,
              address: extractedData.client.address || null,
            } : null,
            cart: extractedData.cart ? extractedData.cart.map((item) => ({
              productId: item.productId ? IdVO.create(item.productId) : null,
              productName: item.productName || null,
              quantity: item.quantity || null,
              price: item.price || null,
            })) : [],
          }
        },
        systemActorId
      );

      const freshSessionRes = await dependencies.chatSessionRepository.getById(session.id!);
      if (!freshSessionRes.isFailure && freshSessionRes.getValue() && dependencies.pubSub) {
        const freshSession = freshSessionRes.getValue()!;
        await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", {
          chatSessionUpdated: {
            id: freshSession.id?.toString(),
            _id: freshSession.id?.toString(),
            whatsappId: freshSession.whatsappId.toString(),
            status: freshSession.status,
            driftCount: freshSession.driftCount,
            assignedUserId: freshSession.assignedUserId?.toString() || null,
            assignedAgentId: freshSession.assignedAgentId?.toString() || null,
            contactName: freshSession.contactName?.toString() || null,
            extractedData: freshSession.extractedData || null,
            tags: freshSession.tags || [],
            createdAt: freshSession.createdAt?.toString() || new Date().toISOString(),
            updatedAt: freshSession.updatedAt?.toString() || new Date().toISOString(),
          }
        });
      }
    }
    const saveAndSendResponse = async (text: string): Promise<Result<void, DomainError>> => {
      const chunks = splitMessageIntoChunks(text, 50);

      for (const chunk of chunks) {
        const botMsgRes = await dependencies.chatMessageRepository.create(
          {
            whatsappId: whatsappIdVO,
            text: NonEmptyStringVO.create(chunk),
            sender: ChatMessageSender.BOT,
          },
          systemActorId
        );
        if (botMsgRes.isFailure) {
          return Result.fail(botMsgRes.getError());
        }

        const savedBotMsg = botMsgRes.getValue();
        const botMsgId = savedBotMsg?.id?.toString();

        const sendRes = await dependencies.whatsAppGateway.sendMessage(
          input.from,
          chunk,
          { alreadySaved: true, messageId: botMsgId }
        );
        if (sendRes.isFailure) {
          return Result.fail(new DomainError(sendRes.getError().message));
        }
      }

      return Result.ok();
    };

    if (isDrift) {
      const newDriftCount = session.driftCount + 1;

      if (newDriftCount >= 3) {
        const handoverRes = await dependencies.handoverToHuman(input.from);
        if (handoverRes.isFailure) {
          return Result.fail(handoverRes.getError());
        }

        const saveSendRes = await saveAndSendResponse(reply);
        if (saveSendRes.isFailure) {
          return Result.fail(saveSendRes.getError());
        }

        return Result.ok<ProcessIncomingMessageOutput, DomainError>({
          sessionId: sessionIdStr,
          status: ChatSessionStatus.PENDING_HUMAN,
          driftCount: 0,
        });
      }

      const updateDriftRes = await dependencies.chatSessionRepository.updateDrift(
        whatsappIdVO,
        newDriftCount,
        systemActorId
      );

      if (updateDriftRes.isFailure) {
        return Result.fail(updateDriftRes.getError());
      }

      const saveSendRes = await saveAndSendResponse(reply);
      if (saveSendRes.isFailure) {
        return Result.fail(saveSendRes.getError());
      }

      return Result.ok<ProcessIncomingMessageOutput, DomainError>({
        sessionId: sessionIdStr,
        status: session.status,
        driftCount: newDriftCount,
      });
    }

    if (session.driftCount > 0) {
      const resetDriftRes = await dependencies.chatSessionRepository.updateDrift(
        whatsappIdVO,
        0,
        systemActorId
      );

      if (resetDriftRes.isFailure) {
        return Result.fail(resetDriftRes.getError());
      }
    }
    const saveSendRes = await saveAndSendResponse(reply);
    if (saveSendRes.isFailure) {
      return Result.fail(saveSendRes.getError());
    }

    return Result.ok<ProcessIncomingMessageOutput, DomainError>({
      sessionId: sessionIdStr,
      status: session.status,
      driftCount: 0,
    });
  };
};

export default makeProcessIncomingMessage;
