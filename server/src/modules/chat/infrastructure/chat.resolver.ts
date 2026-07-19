import { pubSubInstance } from "./pubsub.js";
import { IContext } from "../../../config/apollo.js";
import { Query, agentDocToResponse } from "./chat.resolver.queries.js";
import { Mutation } from "./chat.resolver.mutations.js";
import { IChatSession } from "../application/repositories/chat-session.repository.js";

export default {
  Query,
  Mutation,

  Subscription: {
    chatMessageReceived: {
      subscribe: (
        _parent: unknown,
        { whatsappId }: { whatsappId: string }
      ) => {
        return pubSubInstance.asyncIterator(
          `CHAT_MESSAGE_RECEIVED_${whatsappId}`
        );
      },
    },
    chatSessionUpdated: {
      subscribe: () => {
        return pubSubInstance.asyncIterator("CHAT_SESSION_UPDATED");
      },
    },
    whatsAppConnectionUpdated: {
      subscribe: () => {
        return pubSubInstance.asyncIterator("WHATSAPP_CONNECTION_UPDATED");
      },
    },
  },

  ChatSession: {
    assignedAgent: async (
      parent: IChatSession,
      _args: Record<string, never>,
      { container }: IContext
    ) => {
      if (!parent.assignedAgentId) return null;
      const res = await container.chat.getAgent({
        id: parent.assignedAgentId.toString(),
      });
      if (res.isFailure) return null;
      const agent = res.getValue();
      return agent ? agentDocToResponse(agent) : null;
    },
  },
};
