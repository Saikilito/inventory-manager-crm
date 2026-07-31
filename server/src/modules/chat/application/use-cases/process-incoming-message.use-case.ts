import { createDomainError, DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { createValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
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
import {
  ChatSessionTag, MAX_INCOMING_MESSAGE_LENGTH, MAX_REPLY_WORDS,
  UNSUPPORTED_MEDIA_MESSAGES,
} from "./process-incoming-message.constants.js";
import type { WhatsappRateLimiter } from "../services/whatsapp-rate-limiter.js";
import type { AgentRole } from "../../../../../../shared-domain/src/chat/agent.entity.js";
import {
  buildCompactionTranscript,
  buildPublicActiveHistory,
  COMPACTION_THREAD_BATCH_SIZE,
} from "./process-incoming-message-history.js";
export type {
  IPubSub, IWhatsAppGateway, IExtractedClient, IExtractedCartItem,
  IExtractedData, ILlmAdapter, ILlmKeyMetric, ProcessIncomingMessageInput,
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
  potentialCedulaRegex, buildChatSessionUpdatedPayload,
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
  whatsappRateLimiter?: WhatsappRateLimiter;
}): ProcessIncomingMessage => {
  return async (input: ProcessIncomingMessageInput) => {
    const phoneResult = WhatsappIdVO.createResult(input.from);
    if (phoneResult.isFailure) {
      return Result.fail(
        createValidationError(
          `Invalid phone format: ${input.from}. Must be E.164 compliant (e.g., +12345678900)`
        )
      );
    }

    const isRateLimited = dependencies.whatsappRateLimiter
      ? !dependencies.whatsappRateLimiter.checkAndRecord(input.from)
      : false;
    if (isRateLimited) {
      console.warn(`[ProcessIncomingMessage] Rate limit exceeded for whatsappId=${input.from}`);
    }

    let text = input.text;
    if (text.length > MAX_INCOMING_MESSAGE_LENGTH) {
      console.warn(
        `[ProcessIncomingMessage] Truncating incoming message: length=${text.length}, max=${MAX_INCOMING_MESSAGE_LENGTH}`
      );
      text = text.slice(0, MAX_INCOMING_MESSAGE_LENGTH);
    }

    const matchedToken = text.match(potentialCedulaRegex);
    if (matchedToken) {
      const token = matchedToken[0];
      if (/^[vVeE]-?\d/.test(token)) {
        const prefix = token[0].toUpperCase();
        const numberPart = token.slice(1).replace(/^-/, "").replace(/\./g, "");
        const normalizedToken = `${prefix}-${numberPart}`;
        const cedulaResult = CedulaVO.createResult(normalizedToken);
        if (cedulaResult.isFailure) {
          return Result.fail(
            createValidationError(
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
    let activeThreads: IChatThread[] = [];
    const archivedDateStrs = new Set<string>();
    if (!activeThreadsRes.isFailure) {
      activeThreads = activeThreadsRes.getValue();
      const todayDateStr = getCaracasDateStr();
      const todayThread = activeThreads.find((t: IChatThread) => t.dateStr === todayDateStr);
      const priorActiveThreads = activeThreads.filter((t: IChatThread) => t.dateStr !== todayDateStr);

      if (priorActiveThreads.length >= COMPACTION_THREAD_BATCH_SIZE && !todayThread) {
        const threadsToCompact = priorActiveThreads.slice(0, COMPACTION_THREAD_BATCH_SIZE);
        const chatScriptText = buildCompactionTranscript(threadsToCompact);

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
          dateStrsToArchive.forEach((dateStr) => archivedDateStrs.add(dateStr));
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
        await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", buildChatSessionUpdatedPayload(session, []));
      }
    }

    if (!input.alreadySaved) {
      const incomingMsgRes = await dependencies.chatMessageRepository.create(
        {
          whatsappId: whatsappIdVO,
          text: NonEmptyStringVO.create(text),
          sender: ChatMessageSender.CUSTOMER,
        },
        systemActorId
      );
      if (incomingMsgRes.isFailure) {
        return Result.fail(incomingMsgRes.getError());
      }
    }

    if (isRateLimited) {
      return Result.ok<ProcessIncomingMessageOutput, DomainError>({
        sessionId: sessionIdStr,
        status: session.status,
        driftCount: session.driftCount,
      });
    }

    if (session.status !== ChatSessionStatus.BOT) {
      return Result.ok<ProcessIncomingMessageOutput, DomainError>({
        sessionId: sessionIdStr,
        status: session.status,
        driftCount: session.driftCount,
      });
    }

    const saveAndSendResponse = async (responseText: string): Promise<Result<void, DomainError>> => {
      const chunks = splitMessageIntoChunks(responseText, MAX_REPLY_WORDS);

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
          return Result.fail(createDomainError(sendRes.getError().message));
        }
      }

      return Result.ok();
    };

    if (input.mediaType === "audio" || input.mediaType === "image") {
      const handoverRes = await dependencies.handoverToHuman(input.from);
      if (handoverRes.isFailure) {
        return Result.fail(handoverRes.getError());
      }

      const mediaNotice = input.mediaType === "audio"
        ? UNSUPPORTED_MEDIA_MESSAGES.AUDIO
        : UNSUPPORTED_MEDIA_MESSAGES.IMAGE;

      const saveSendRes = await saveAndSendResponse(mediaNotice);
      if (saveSendRes.isFailure) {
        return Result.fail(saveSendRes.getError());
      }

      return Result.ok<ProcessIncomingMessageOutput, DomainError>({
        sessionId: sessionIdStr,
        status: ChatSessionStatus.PENDING_HUMAN,
        driftCount: 0,
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
    const history = buildPublicActiveHistory(activeThreads, archivedDateStrs);

    let systemPrompt: string | undefined;
    let enabledTools: string[] | undefined;
    let profile: AgentRole | undefined;
    if (session.assignedAgentId && dependencies.agentRepository) {
      const agentRes = await dependencies.agentRepository.getById(session.assignedAgentId);
      if (!agentRes.isFailure && agentRes.getValue()) {
        const agent = agentRes.getValue()!;
        systemPrompt = agent.systemPrompt.toString();
        enabledTools = agent.enabledTools;
        profile = agent.role;
      }
    }
    const llmRes = await dependencies.llmAdapter.generateResponse(
      input.from,
      text,
      history,
      {
        isOutOfHours,
        profile,
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
        await dependencies.pubSub.publish("CHAT_SESSION_UPDATED", buildChatSessionUpdatedPayload(freshSession));
      }
    }

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
