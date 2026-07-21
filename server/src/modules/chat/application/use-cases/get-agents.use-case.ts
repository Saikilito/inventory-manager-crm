import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
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
If they ask for delivery costs, use calculateDeliveryFee.`;

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

      // Auto-Seeding: If no agents exist, create the default Slayer Sales agent
      if (agents.length === 0) {
        const defaultAgent = makeAgent({
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

        const systemActorId = IdVO.generateNil();
        const createRes = await agentRepository.create(defaultAgent, systemActorId);

        if (createRes.isFailure) {
          console.error('Failed to auto-seed default Slayer agent:', createRes.getError().message);
          return Result.ok<IAgent[], DomainError>([]); // Return empty if seed fails safely
        }

        return Result.ok<IAgent[], DomainError>([createRes.getValue()]);
      }

      return Result.ok<IAgent[], DomainError>(agents);
    } catch (error) {
      return Result.fail(new DomainError(error instanceof Error ? error.message : 'Failed to retrieve agents'));
    }
  };
};

export default makeGetAgents;
