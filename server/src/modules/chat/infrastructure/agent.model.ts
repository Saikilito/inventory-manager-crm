import mongoose, { Schema, Document } from "mongoose";
import { AgentStatus, AgentRole, AgentTool } from "../application/repositories/agent.repository.js";

export interface IAgentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  systemPrompt: string;
  status: AgentStatus;
  role: AgentRole;
  enabledTools: AgentTool[];
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgentDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AgentStatus),
      default: AgentStatus.ACTIVE,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(AgentRole),
      default: AgentRole.SALES,
      required: true,
    },
    enabledTools: {
      type: [String],
      enum: Object.values(AgentTool),
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const AgentModel =
  mongoose.models.Agent ||
  mongoose.model<IAgentDocument>("Agent", agentSchema);

export default AgentModel;
