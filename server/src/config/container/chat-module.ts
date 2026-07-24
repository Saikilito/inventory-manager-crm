import { makeAgentMongooseRepository } from '../../modules/chat/infrastructure/repositories/agent-mongoose.repository.js';
import { makeChatSessionMongooseRepository } from '../../modules/chat/infrastructure/repositories/chat-session-mongoose.repository.js';
import { makeChatMessageMongooseRepository } from '../../modules/chat/infrastructure/repositories/chat-message-mongoose.repository.js';
import { makeUnsatisfiedDemandMongooseRepository } from '../../modules/chat/infrastructure/repositories/unsatisfied-demand-mongoose.repository.js';
import { makeBaileysAuthMongooseRepository } from '../../modules/chat/infrastructure/repositories/baileys-auth-mongoose.repository.js';
import { makeBaileysGateway } from '../../modules/chat/infrastructure/services/baileys.gateway.js';
import { makeGeminiLlmAdapter } from '../../modules/chat/infrastructure/services/gemini.adapter.js';
import { makeKnowledgeInjector } from '../../modules/chat/infrastructure/services/knowledge-injector.js';
import { makeCheckWorkingHours } from '../../modules/chat/application/use-cases/check-working-hours.use-case.js';
import { makeCalculateDeliveryFee } from '../../modules/chat/application/use-cases/calculate-delivery-fee.use-case.js';
import { makeHandoverToHuman } from '../../modules/chat/application/use-cases/handover-to-human.use-case.js';
import { makeLogUnsatisfiedDemand } from '../../modules/chat/application/use-cases/log-unsatisfied-demand.use-case.js';
import { makeProcessIncomingMessage } from '../../modules/chat/application/use-cases/process-incoming-message.use-case.js';
import { makeInitializeWhatsApp } from '../../modules/chat/application/use-cases/initialize-whatsapp.use-case.js';
import { makeCreateAgent } from '../../modules/chat/application/use-cases/create-agent.use-case.js';
import { makeUpdateAgent } from '../../modules/chat/application/use-cases/update-agent.use-case.js';
import { makeDeleteAgent } from '../../modules/chat/application/use-cases/delete-agent.use-case.js';
import { makeGetAgents } from '../../modules/chat/application/use-cases/get-agents.use-case.js';
import { makeGetAgent } from '../../modules/chat/application/use-cases/get-agent.use-case.js';
import { makeGetChatSessions } from '../../modules/chat/application/use-cases/get-chat-sessions.use-case.js';
import { makeAssignAgentToSession } from '../../modules/chat/application/use-cases/assign-agent-to-session.use-case.js';
import { makeSendWhisperToAgent } from '../../modules/chat/application/use-cases/send-whisper-to-agent.use-case.js';
import { makeCreateClient } from '../../modules/client/application/use-cases/create-client.js';
import { makeOrderMongooseRepository } from '../../modules/order/infrastructure/repositories/order-mongoose.repository.js';
import { makeDeliveryMongooseRepository } from '../../modules/delivery/infrastructure/repositories/delivery-mongoose.repository.js';
import { makeRecalculateClientRating } from '../../modules/client/application/use-cases/recalculate-client-rating.js';
import { makeCreateOrder } from '../../modules/order/application/use-cases/create-order.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';
import { IClientRepository } from '../../modules/client/application/repositories/client.repository.js';
import { IKnowledgeRepository } from '../../modules/knowledge/application/repositories/knowledge.repository.js';
import { makeCognitiveRouter } from '../../modules/knowledge/domain/services/cognitive-router.js';
import { IConfig } from '../index.js';

export interface ChatSubContainer {
  checkWorkingHours: ReturnType<typeof makeCheckWorkingHours>;
  calculateDeliveryFee: ReturnType<typeof makeCalculateDeliveryFee>;
  handoverToHuman: ReturnType<typeof makeHandoverToHuman>;
  logUnsatisfiedDemand: ReturnType<typeof makeLogUnsatisfiedDemand>;
  processIncomingMessage: ReturnType<typeof makeProcessIncomingMessage>;
  initializeWhatsApp: ReturnType<typeof makeInitializeWhatsApp>;
  createAgent: ReturnType<typeof makeCreateAgent>;
  updateAgent: ReturnType<typeof makeUpdateAgent>;
  deleteAgent: ReturnType<typeof makeDeleteAgent>;
  getAgents: ReturnType<typeof makeGetAgents>;
  getAgent: ReturnType<typeof makeGetAgent>;
  getChatSessions: ReturnType<typeof makeGetChatSessions>;
  assignAgentToSession: ReturnType<typeof makeAssignAgentToSession>;
  sendWhisperToAgent: ReturnType<typeof makeSendWhisperToAgent>;
  chatSessionRepository: ReturnType<typeof makeChatSessionMongooseRepository>;
  chatMessageRepository: ReturnType<typeof makeChatMessageMongooseRepository>;
  agentRepository: ReturnType<typeof makeAgentMongooseRepository>;
  unsatisfiedDemandRepository: ReturnType<typeof makeUnsatisfiedDemandMongooseRepository>;
  baileysAuthRepository: ReturnType<typeof makeBaileysAuthMongooseRepository>;
  whatsAppGateway: ReturnType<typeof makeBaileysGateway>;
  llmAdapter: ReturnType<typeof makeGeminiLlmAdapter>;
}

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
}

export interface ChatModuleDependencies {
  productRepository: IProductRepository;
  clientRepository: IClientRepository;
  pubSubInstance: IPubSub;
  knowledgeRepository: IKnowledgeRepository;
  config: Pick<IConfig, "knowledgeInjectionEnabled" | "knowledgeInjectionTopN" | "knowledgeInjectionTokenBudget">;
}

export const buildChatModule = (deps: ChatModuleDependencies): ChatSubContainer => {
  const { productRepository, clientRepository, pubSubInstance: pubSub, knowledgeRepository, config } = deps;
  const agentRepository = makeAgentMongooseRepository();
  const chatSessionRepository = makeChatSessionMongooseRepository();
  const chatMessageRepository = makeChatMessageMongooseRepository();
  const unsatisfiedDemandRepository = makeUnsatisfiedDemandMongooseRepository();
  const baileysAuthRepository = makeBaileysAuthMongooseRepository();

  // The LLM adapter is a thin wrapper around Gemini. It only needs the use
  // cases it actually invokes through the tool dispatcher (createClient,
  // createOrder, calculateDeliveryFee, logUnsatisfiedDemand) plus the two
  // repositories the dispatcher queries directly.
  const createClient = makeCreateClient(clientRepository);
  const orderRepository = makeOrderMongooseRepository();
  const deliveryRepository = makeDeliveryMongooseRepository();
  const recalculateClientRating = makeRecalculateClientRating(clientRepository, orderRepository);
  const createOrder = makeCreateOrder(orderRepository, productRepository, recalculateClientRating, clientRepository, deliveryRepository);
  const calculateDeliveryFee = makeCalculateDeliveryFee(knowledgeRepository);
  const logUnsatisfiedDemand = makeLogUnsatisfiedDemand(unsatisfiedDemandRepository);

  const cognitiveRouter = makeCognitiveRouter({
    textSearch: (query, category) => knowledgeRepository.textSearch(query, category),
  });
  const knowledgeInjector = makeKnowledgeInjector({ cognitiveRouter });

  const llmAdapter = makeGeminiLlmAdapter({
    agentRepository,
    productRepository,
    clientRepository,
    calculateDeliveryFee,
    logUnsatisfiedDemand,
    createClient,
    createOrder,
    knowledgeInjector,
    config,
  });
  const whatsAppGateway = makeBaileysGateway({ baileysAuthRepository, chatMessageRepository });

  const checkWorkingHours = makeCheckWorkingHours();
  const handoverToHuman = makeHandoverToHuman({ chatSessionRepository, whatsAppGateway, pubSub });

  const processIncomingMessage = makeProcessIncomingMessage({
    chatSessionRepository,
    chatMessageRepository,
    agentRepository,
    whatsAppGateway,
    llmAdapter,
    clientRepository,
    checkWorkingHours,
    handoverToHuman,
    pubSub,
  });

  const initializeWhatsApp = makeInitializeWhatsApp({ whatsAppGateway, processIncomingMessage });
  const createAgent = makeCreateAgent(agentRepository);
  const updateAgent = makeUpdateAgent(agentRepository);
  const deleteAgent = makeDeleteAgent(agentRepository);
  const getAgents = makeGetAgents(agentRepository);
  const getAgent = makeGetAgent(agentRepository);
  const getChatSessions = makeGetChatSessions(chatSessionRepository);
  const assignAgentToSession = makeAssignAgentToSession({
    chatSessionRepository,
    agentRepository,
    pubSub,
  });
  const sendWhisperToAgent = makeSendWhisperToAgent({
    chatSessionRepository,
    chatMessageRepository,
    llmAdapter,
    pubSub,
  });

  return {
    checkWorkingHours,
    calculateDeliveryFee,
    handoverToHuman,
    logUnsatisfiedDemand,
    processIncomingMessage,
    initializeWhatsApp,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgents,
    getAgent,
    getChatSessions,
    assignAgentToSession,
    sendWhisperToAgent,
    chatSessionRepository,
    chatMessageRepository,
    agentRepository,
    unsatisfiedDemandRepository,
    baileysAuthRepository,
    whatsAppGateway,
    llmAdapter,
  };
};
