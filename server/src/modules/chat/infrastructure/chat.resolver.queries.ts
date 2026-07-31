import { IContext } from "../../../config/apollo.js";
import { IChatSessionDocument } from "./chat-session.model.js";
import { IAgent } from "../application/repositories/agent.repository.js";
import { IChatMessage } from "../application/repositories/chat-message.repository.js";
import { NonEmptyStringVO } from "../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumberVO } from "../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { UserRole } from "../../../../../shared-domain/src/shared/value-objects/role.vo.js";
import { MongoQueryConstants } from "./services/gemini.constants.js";

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

const requireAuth = async (token: () => Promise<unknown>): Promise<unknown> => {
  const user = await token();
  if (!user) {
    throw new Error("Unauthenticated: Access Denied");
  }
  return user;
};

interface DecodedToken {
  email: string;
}

const requireAdmin = async ({ container, token }: IContext): Promise<void> => {
  const decoded = (await requireAuth(token)) as DecodedToken;

  const currentUserRes = await container.user.getUserByEmail(decoded.email);
  if (currentUserRes.isFailure || !currentUserRes.getValue()) {
    throw new Error("Unauthenticated: Access Denied");
  }

  const currentUser = currentUserRes.getValue()!;
  if (currentUser.disabled === true) {
    throw new Error("Account is disabled");
  }
  if (String(currentUser.role) !== UserRole.ADMIN) {
    throw new Error("Unauthorized: Admin role required");
  }
};

export const Query = {
  getChatSessions: async (
    _parent: unknown,
    _args: unknown,
    { container, token }: IContext,
  ) => {
    await requireAuth(token);

    const res = await container.chat.getChatSessions({});
    if (res.isFailure) {
      throw new Error(res.getError().message);
    }
    return res.getValue();
  },

  getChatMessages: async (
    _parent: unknown,
    { whatsappId }: { whatsappId: string },
    { container, token }: IContext,
  ) => {
    await requireAuth(token);

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

  getWhatsAppConnectionState: async (
    _parent: unknown,
    _args: unknown,
    { container, token }: IContext,
  ) => {
    await requireAuth(token);

    const state = container.chat.whatsAppGateway.getConnectionState();
    return {
      status: state.status,
      qr: state.qr,
    };
  },

  getAgents: async (
    _parent: unknown,
    _args: unknown,
    { container, token }: IContext,
  ) => {
    await requireAuth(token);

    const res = await container.chat.getAgents({});
    if (res.isFailure) {
      throw new Error(res.getError().message);
    }
    return res.getValue().map((agent: IAgent) => agentDocToResponse(agent));
  },

  getAgent: async (
    _parent: unknown,
    { id }: { id: string },
    { container, token }: IContext,
  ) => {
    await requireAuth(token);

    const res = await container.chat.getAgent({ id });
    if (res.isFailure) {
      throw new Error(res.getError().message);
    }
    return agentDocToResponse(res.getValue());
  },

  getGeminiKeyMetrics: async (
    _parent: unknown,
    _args: unknown,
    context: IContext,
  ) => {
    await requireAdmin(context);

    return context.container.chat.llmAdapter.getKeyMetrics?.() ?? [];
  },
};
