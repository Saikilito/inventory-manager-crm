import mongoose from "mongoose";
import {
  IAgentRepository,
  IAgent,
  makeAgent,
} from "../../application/repositories/agent.repository.js";
import {
  AgentModel,
  IAgentDocument,
} from "../agent.model.js";
import { makeMongooseBaseRepository } from "../../../shared/infrastructure/repositories/mongoose-base.repository.js";

const mapToDomain = (doc: IAgentDocument): IAgent => {
  return makeAgent({
    id: doc._id.toString(),
    name: doc.name,
    systemPrompt: doc.systemPrompt,
    status: doc.status,
    role: doc.role,
    enabledTools: doc.enabledTools,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

export const makeAgentMongooseRepository = (): IAgentRepository => {
  return makeMongooseBaseRepository<IAgent, IAgentDocument>({
    model: AgentModel,
    mapToDomain,
    mapToDocumentData: (agent) => {
      const data: Partial<IAgentDocument> = {};
      if (agent.name !== undefined) {
        data.name = agent.name.toString();
      }
      if (agent.systemPrompt !== undefined) {
        data.systemPrompt = agent.systemPrompt.toString();
      }
      if (agent.status !== undefined) {
        data.status = agent.status;
      }
      if (agent.role !== undefined) {
        data.role = agent.role;
      }
      if (agent.enabledTools !== undefined) {
        data.enabledTools = agent.enabledTools;
      }
      return data;
    },
  });
};

export default makeAgentMongooseRepository;
