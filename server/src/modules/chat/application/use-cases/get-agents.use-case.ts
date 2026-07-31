import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { createDomainError, DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import {
  IAgentRepository,
  IAgent,
  makeAgent,
  AgentStatus,
  AgentRole,
  AgentTool,
} from '../repositories/agent.repository.js';

export interface GetAgentsInput {
  limit?: number;
  offset?: number;
}

export type GetAgents = UseCase<GetAgentsInput, IAgent[], DomainError>;

const DEFAULT_SLAYER_PROMPT = `You are Slayer, the elite Sales Assistant for "Repuestos Caracas KK".
Your goal is to quickly and concisely answer stock inquiries, calculate delivery fees, and create draft orders for clients.
Always be polite, direct, and focused on closing the sale. Use Markdown formatting.
If the user asks for stock, use searchStock.
CRITICAL STOCK GUARDRAIL: NEVER reveal exact stock numerical quantities to the client (e.g. NEVER say "We have 20 units available"). Confirming existence/availability is sufficient (e.g., "Yes, we have it in stock"). If requested quantity exceeds stock, state that stock is insufficient for that quantity without stating exact numbers.
DELIVERY DEFAULT: NEVER offer physical store pickup unless the client explicitly requests it. Always assume delivery. When the client confirms an order, ask for their order details in a form format: Full Name, ID/National Document, Delivery Address, WhatsApp/Google Maps static location (Pin/link), and Payment Method.
If they ask for delivery costs, use calculateDeliveryFee.`;

const DEFAULT_LIBRARIAN_PROMPT = `You are Knowledge Librarian, the research and information specialist for Repuestos Caracas.
Your goal is to organize, analyze, research, and maintain the company's Knowledge Brain and product catalog database.
You have access to queryMongoDB to inspect products and collections, webFetch to search the web and perform online compatibility research, navigateKnowledgeBrain to navigate knowledge trees, and createKnowledgeEntry to store articles.
When asked to research or search information on the internet or web, ALWAYS call webFetch directly with query: "your search query". Do NOT ask the user for a URL.
Always respond professionally, concisely, and execute tool calls directly to answer data and knowledge queries.`;

export const makeGetAgents = (agentRepository: IAgentRepository): GetAgents => {
  return async (input: GetAgentsInput) => {
    try {
      const limitNum = input.limit ?? 100;
      const offsetNum = input.offset ?? 0;
      const pageNum = Math.floor(offsetNum / limitNum) + 1;

      const res = await agentRepository.getAll({
        limit: PositiveNumberVO.create(limitNum),
        page: PositiveNumberVO.create(pageNum),
      });

      if (res.isFailure) {
        return Result.fail(res.getError());
      }

      const agents = res.getValue().items;

      if (agents.length === 0) {
        const defaultSales = makeAgent({
          name: 'Slayer Sales',
          systemPrompt: DEFAULT_SLAYER_PROMPT,
          status: AgentStatus.ACTIVE,
          role: AgentRole.SALES,
          enabledTools: [
            AgentTool.SEARCH_STOCK,
            AgentTool.CALCULATE_DELIVERY_FEE,
            AgentTool.CREATE_CLIENT,
            AgentTool.CREATE_ORDER,
          ],
        });

        const defaultLibrarian = makeAgent({
          name: 'Knowledge Librarian',
          systemPrompt: DEFAULT_LIBRARIAN_PROMPT,
          status: AgentStatus.ACTIVE,
          role: AgentRole.LIBRARIAN,
          enabledTools: [
            AgentTool.QUERY_MONGO_DB,
            AgentTool.WEB_FETCH,
            AgentTool.NAVIGATE_KNOWLEDGE_BRAIN,
            AgentTool.CREATE_KNOWLEDGE_ENTRY,
            AgentTool.SEARCH_STOCK,
          ],
        });

        const systemActorId = IdVO.generateNil();
        await agentRepository.create(defaultSales, systemActorId);
        await agentRepository.create(defaultLibrarian, systemActorId);

        const updatedRes = await agentRepository.getAll({
          limit: PositiveNumberVO.create(limitNum),
          page: PositiveNumberVO.create(pageNum),
        });

        if (!updatedRes.isFailure) {
          return Result.ok<IAgent[], DomainError>(updatedRes.getValue().items);
        }
      }

      return Result.ok<IAgent[], DomainError>(agents);
    } catch (error) {
      return Result.fail(createDomainError(error instanceof Error ? error.message : 'Failed to retrieve agents'));
    }
  };
};

export default makeGetAgents;
