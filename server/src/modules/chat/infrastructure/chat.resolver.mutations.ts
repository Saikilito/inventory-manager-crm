import { IContext } from "../../../config/apollo.js";
import { ChatSessionModel, IChatSessionDocument } from "./chat-session.model.js";
import { ChatMessageModel } from "./chat-message.model.js";
import { AgentModel } from "./agent.model.js";
import { pubSubInstance } from "./pubsub.js";
import { IdVO } from "../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { ChatSessionStatus } from "../application/repositories/chat-session.repository.js";
import { AgentRole } from "../application/repositories/agent.repository.js";
import { ChatMessageSender } from "../application/repositories/chat-message.repository.js";
import { WhatsAppConstants } from "./services/whatsapp-constants.js";
import {
  chatSessionDocToResponse,
  agentDocToResponse,
} from "./chat.resolver.queries.js";
import { CreateAgentInput } from "../application/use-cases/create-agent.use-case.js";
import { UpdateAgentInput } from "../application/use-cases/update-agent.use-case.js";

interface UserPayload {
  id?: string;
  email?: string;
}

const sandboxHistories = new Map<string, Array<{ role: string; text: string }>>();

const publishSessionUpdated = async (doc: IChatSessionDocument) => {
  const response = chatSessionDocToResponse(doc);
  await pubSubInstance.publish("CHAT_SESSION_UPDATED", {
    chatSessionUpdated: response,
  });
  return response;
};

export const Mutation = {
  createChatSession: async (
    _parent: unknown,
    { whatsappId }: { whatsappId: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    let cleaned = whatsappId.replace(/[\s\-+]/g, "");
    if (!cleaned.endsWith("@s.whatsapp.net")) cleaned = `${cleaned}@s.whatsapp.net`;
    const sessionRes = await container.chat.chatSessionRepository.getOrCreate(
      NonEmptyStringVO.create(cleaned),
      IdVO.generateNil(),
    );
    if (sessionRes.isFailure) throw new Error(sessionRes.getError().message);
    const session = sessionRes.getValue();
    const doc = await ChatSessionModel.findById(session.id!.toString()).exec();
    if (!doc) throw new Error("Chat session not found or deleted after creation");
    return publishSessionUpdated(doc);
  },
  claimChatSession: async (
    _parent: unknown,
    { whatsappId }: { whatsappId: string },
    { container, token }: IContext,
  ) => {
    const userPayload = (await token()) as UserPayload | null;
    if (!userPayload || !userPayload.id) {
      throw new Error("Unauthenticated: You must be logged in to claim a chat session");
    }
    const userId = userPayload.id;
    const systemActorId = IdVO.generateNil();
    const sessionRes = await container.chat.chatSessionRepository.getOne([
      { field: NonEmptyStringVO.create("whatsappId"), value: NonEmptyStringVO.create(whatsappId) },
    ]);
    if (sessionRes.isFailure) throw new Error("Chat session not found");
    const session = sessionRes.getValue();
    if (!session) throw new Error("Chat session not found");
    const updateRes = await container.chat.chatSessionRepository.updateById(
      session.id!,
      { status: ChatSessionStatus.HUMAN, assignedUserId: IdVO.create(userId), driftCount: 0 },
      systemActorId,
    );
    if (updateRes.isFailure) throw new Error(updateRes.getError().message);
    const updatedSession = await ChatSessionModel.findById(session.id!.toString()).exec();
    if (!updatedSession) throw new Error("Chat session not found or deleted");
    return publishSessionUpdated(updatedSession);
  },
  sendMessageToChat: async (
    _parent: unknown,
    { whatsappId, text }: { whatsappId: string; text: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const sendRes = await container.chat.whatsAppGateway.sendMessage(
      whatsappId,
      text,
      { alreadySaved: true, skipPublish: true },
    );
    if (sendRes.isFailure) throw new Error(sendRes.getError().message);
    const systemActorId = IdVO.generateNil();
    const createRes = await container.chat.chatMessageRepository.create(
      {
        whatsappId: NonEmptyStringVO.create(whatsappId),
        text: NonEmptyStringVO.create(text),
        sender: ChatMessageSender.AGENT,
      },
      systemActorId,
    );
    if (createRes.isFailure) throw new Error(createRes.getError().message);
    const savedMsg = createRes.getValue();
    await pubSubInstance.publish(`CHAT_MESSAGE_RECEIVED_${whatsappId}`, {
      chatMessageReceived: {
        id: savedMsg.id!.toString(),
        text,
        sender: ChatMessageSender.AGENT,
        createdAt: savedMsg.createdAt!.toString(),
      },
    });
    return true;
  },
  updateChatSessionStatus: async (
    _parent: unknown,
    { whatsappId, status }: { whatsappId: string; status: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const systemActorId = IdVO.generateNil();
    const sessionRes = await container.chat.chatSessionRepository.getOne([
      { field: NonEmptyStringVO.create("whatsappId"), value: NonEmptyStringVO.create(whatsappId) },
    ]);
    if (sessionRes.isFailure) throw new Error("Chat session not found");
    const session = sessionRes.getValue();
    if (!session) throw new Error("Chat session not found");
    const updateRes = await container.chat.chatSessionRepository.updateById(
      session.id!,
      {
        status: status as ChatSessionStatus,
        assignedUserId:
          status === ChatSessionStatus.BOT || status === ChatSessionStatus.PENDING_HUMAN ? null : session.assignedUserId,
        driftCount: 0,
      },
      systemActorId,
    );
    if (updateRes.isFailure) throw new Error(updateRes.getError().message);
    const updatedSession = await ChatSessionModel.findById(session.id!.toString()).exec();
    if (!updatedSession) throw new Error("Chat session not found or deleted");
    return publishSessionUpdated(updatedSession);
  },
  askCrmAssistant: async (
    _parent: unknown,
    { text }: { text: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const result = await container.chat.llmAdapter.generateResponse(
      "crm-operator",
      text,
      [],
      { isFromCrm: true, profile: AgentRole.CRM_OPERATOR },
    );
    if (result.isFailure) throw new Error(result.getError().message);
    return result.getValue().reply;
  },
  askAgent: async (
    _parent: unknown,
    { agentId, text }: { agentId: string; text: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const agent = await AgentModel.findById(agentId).exec();
    if (!agent) throw new Error("Agent not found");
    const sessionKey = `${(user as UserPayload | null)?.id || "default"}:${agentId}`;
    let sandboxHistory = sandboxHistories.get(sessionKey) || [];
    const normalizedText = text.trim().toLowerCase();
    if (normalizedText === "hola" || normalizedText === "hola}" || normalizedText === "clear" || normalizedText === "reset") {
      sandboxHistory = [];
    }
    const result = await container.chat.llmAdapter.generateResponse(
      "crm-operator",
      text,
      sandboxHistory,
      { isFromCrm: true, profile: agent.role, systemPrompt: agent.systemPrompt, enabledTools: agent.enabledTools },
    );
    if (result.isFailure) throw new Error(result.getError().message);
    const reply = result.getValue().reply;
    sandboxHistory.push({ role: "user", text });
    sandboxHistory.push({ role: "model", text: reply });
    if (sandboxHistory.length > WhatsAppConstants.MAX_SANDBOX_HISTORY_MESSAGES) sandboxHistory = sandboxHistory.slice(-WhatsAppConstants.MAX_SANDBOX_HISTORY_MESSAGES);
    sandboxHistories.set(sessionKey, sandboxHistory);
    return reply;
  },
  deleteChatSession: async (
    _parent: unknown,
    { whatsappId }: { whatsappId: string },
    { token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const session = await ChatSessionModel.findOne({ whatsappId }).exec();
    if (!session) return false;
    await ChatSessionModel.deleteOne({ whatsappId }).exec();
    await ChatMessageModel.deleteMany({ whatsappId }).exec();
    await pubSubInstance.publish("CHAT_SESSION_UPDATED", {
      chatSessionUpdated: {
        id: session._id.toString(),
        _id: session._id.toString(),
        whatsappId: session.whatsappId,
        status: "DELETED",
        driftCount: session.driftCount,
        assignedUserId: session.assignedUserId?.toString() || null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return true;
  },
  createAgent: async (
    _parent: unknown,
    { input }: { input: CreateAgentInput },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const res = await container.chat.createAgent(input);
    if (res.isFailure) throw new Error(res.getError().message);
    return agentDocToResponse(res.getValue());
  },
  updateAgent: async (
    _parent: unknown,
    { input }: { input: UpdateAgentInput },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const res = await container.chat.updateAgent(input);
    if (res.isFailure) throw new Error(res.getError().message);
    return agentDocToResponse(res.getValue());
  },
  deleteAgent: async (
    _parent: unknown,
    { id }: { id: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const res = await container.chat.deleteAgent({ id });
    if (res.isFailure) throw new Error(res.getError().message);
    return true;
  },
  assignAgentToSession: async (
    _parent: unknown,
    { whatsappId, agentId }: { whatsappId: string; agentId: string | null },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const res = await container.chat.assignAgentToSession({ whatsappId, agentId });
    if (res.isFailure) throw new Error(res.getError().message);
    const session = res.getValue();
    return {
      id: session.id?.toString(),
      _id: session.id?.toString(),
      whatsappId: session.whatsappId.toString(),
      status: session.status,
      driftCount: session.driftCount,
      assignedUserId: session.assignedUserId?.toString() || null,
      assignedAgentId: session.assignedAgentId?.toString() || null,
      contactName: session.contactName?.toString() || null,
      extractedData: session.extractedData || null,
      tags: session.tags || [],
      createdAt: session.createdAt?.toString() || new Date().toISOString(),
      updatedAt: session.updatedAt?.toString() || new Date().toISOString(),
    };
  },
  sendWhisperToAgent: async (
    _parent: unknown,
    { whatsappId, text }: { whatsappId: string; text: string },
    { container, token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const res = await container.chat.sendWhisperToAgent({ whatsappId, text });
    if (res.isFailure) throw new Error(res.getError().message);
    const msg = res.getValue();
    return {
      id: msg.id?.toString(),
      _id: msg.id?.toString(),
      text: msg.text.toString(),
      sender: msg.sender,
      isPrivate: msg.isPrivate,
      createdAt: msg.createdAt?.toString() || new Date().toISOString(),
    };
  },
  saveContactName: async (
    _parent: unknown,
    { whatsappId, name }: { whatsappId: string; name: string },
    { token }: IContext,
  ) => {
    const user = await token();
    if (!user) throw new Error("Unauthenticated: Access Denied");
    const updatedSession = await ChatSessionModel.findOneAndUpdate(
      { whatsappId },
      { $set: { contactName: name } },
      { new: true },
    ).exec();
    if (!updatedSession) throw new Error("Chat session not found");
    return publishSessionUpdated(updatedSession);
  },
};
