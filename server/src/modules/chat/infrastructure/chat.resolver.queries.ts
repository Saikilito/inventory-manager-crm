import { IContext } from "../../../config/apollo.js";
import { ChatSessionModel, IChatSessionDocument } from "./chat-session.model.js";
import { ChatSettingsModel } from "./chat-settings.model.js";
import { AgentModel } from "./agent.model.js";
import { NonEmptyStringVO } from "../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumberVO } from "../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { MongoQueryConstants } from "./services/gemini.constants.js";
import { IAgent } from "../application/repositories/agent.repository.js";
import { IChatMessage } from "../application/repositories/chat-message.repository.js";

export const chatSessionDocToResponse = (doc: IChatSessionDocument) => ({
  id: doc._id.toString(),
  _id: doc._id.toString(),
  whatsappId: doc.whatsappId,
  status: doc.status,
  driftCount: doc.driftCount,
  assignedUserId: doc.assignedUserId?.toString() || null,
  assignedAgentId: doc.assignedAgentId?.toString() || null,
  contactName: doc.contactName || null,
  extractedData: doc.extractedData || null,
  tags: doc.tags || [],
  historicalSummary: doc.historicalSummary || null,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export const agentDocToResponse = (agent: IAgent) => ({
  id: agent.id?.toString(),
  _id: agent.id?.toString(),
  name: agent.name.toString(),
  systemPrompt: agent.systemPrompt.toString(),
  status: agent.status,
  role: agent.role,
  enabledTools: agent.enabledTools,
  createdAt: agent.createdAt?.toString(),
  updatedAt: agent.updatedAt?.toString(),
});

export const Query = {
  getChatSessions: async (
    _parent: unknown,
    _args: unknown,
    { token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }
    const sessions = await ChatSessionModel.find()
      .sort({ updatedAt: -1 })
      .exec();
    return sessions.map((doc: IChatSessionDocument) => chatSessionDocToResponse(doc));
  },

  getChatMessages: async (
    _parent: unknown,
    { whatsappId }: { whatsappId: string },
    { container, token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }
    const messagesRes = await container.chat.chatMessageRepository.getAll({
      where: {
        fields: [
          {
            field: NonEmptyStringVO.create("whatsappId"),
            value: NonEmptyStringVO.create(whatsappId),
          },
        ],
      },
      sort: {
        field: "createdAt",
        direction: "ASC",
      },
      limit: PositiveNumberVO.create(MongoQueryConstants.DEFAULT_PAGE_LIMIT),
    });

    if (messagesRes.isFailure) {
      throw new Error(messagesRes.getError().message);
    }

    const paginated = messagesRes.getValue();
    return paginated.items.map((item: IChatMessage) => ({
      id: item.id?.toString() || "",
      text: item.text?.toString() || "",
      sender: item.sender,
      isPrivate: item.isPrivate,
      createdAt: item.createdAt?.toString() || new Date().toISOString(),
    }));
  },

  getChatSettings: async (
    _parent: unknown,
    _args: unknown,
    { token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }
    const settings = await ChatSettingsModel.findOne().exec();
    if (!settings) {
      return null;
    }
    return {
      pagoMovilBank: settings.pagoMovilBank,
      pagoMovilPhone: settings.pagoMovilPhone,
      pagoMovilId: settings.pagoMovilId,
      whatsappOriginLatitude: settings.whatsappOriginLatitude,
      whatsappOriginLongitude: settings.whatsappOriginLongitude,
      whatsappAlertGroupJid: settings.whatsappAlertGroupJid,
      systemPrompt: settings.systemPrompt,
      binancePayUser: settings.binancePayUser,
    };
  },

  getWhatsAppConnectionState: async (
    _parent: unknown,
    _args: unknown,
    { container, token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }
    const state = container.chat.whatsAppGateway.getConnectionState();
    return {
      status: state.status,
      qr: state.qr,
    };
  },

  getAgents: async (
    _parent: unknown,
    _args: unknown,
    { container, token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }

    const count = await AgentModel.countDocuments();
    if (count === 0) {
      const settings = await ChatSettingsModel.findOne().exec();
      const defaultPrompt = settings?.systemPrompt ?? "You are a helpful sales assistant.";
      await AgentModel.create({
        name: "Default Sales Agent",
        systemPrompt: defaultPrompt,
        status: "ACTIVE",
        role: "SALES",
        enabledTools: [
          "searchStock",
          "calculateDeliveryFee",
          "createClient",
          "createOrder",
        ],
      });
    }

    const res = await container.chat.getAgents({});
    if (res.isFailure) {
      throw new Error(res.getError().message);
    }
    return res.getValue().map((agent: IAgent) => agentDocToResponse(agent));
  },

  getAgent: async (
    _parent: unknown,
    { id }: { id: string },
    { container, token }: IContext
  ) => {
    const user = await token();
    if (!user) {
      throw new Error("Unauthenticated: Access Denied");
    }
    const res = await container.chat.getAgent({ id });
    if (res.isFailure) {
      throw new Error(res.getError().message);
    }
    return agentDocToResponse(res.getValue());
  },
};
