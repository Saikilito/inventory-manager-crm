import mongoose, { Schema, Document } from "mongoose";
import { ChatSessionStatus } from "../application/repositories/chat-session.repository.js";

export interface IChatSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  whatsappId: string;
  status: ChatSessionStatus;
  driftCount: number;
  assignedUserId?: mongoose.Types.ObjectId | null;
  assignedAgentId?: mongoose.Types.ObjectId | null;
  contactName?: string | null;
  extractedData?: {
    client?: {
      firstName?: string | null;
      lastName?: string | null;
      nationalId?: string | null;
      address?: string | null;
    } | null;
    cart?: {
      productId?: mongoose.Types.ObjectId | null;
      productName?: string | null;
      quantity?: number | null;
      price?: number | null;
    }[] | null;
  } | null;
  tags: string[];
  historicalSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const extractedClientSchema = new Schema(
  {
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    nationalId: { type: String, default: null },
    address: { type: String, default: null },
  },
  { _id: false }
);

const extractedCartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: null },
    quantity: { type: Number, default: null },
    price: { type: Number, default: null },
  },
  { _id: false }
);

const extractedDataSchema = new Schema(
  {
    client: { type: extractedClientSchema, default: null },
    cart: { type: [extractedCartItemSchema], default: [] },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSessionDocument>(
  {
    whatsappId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [ChatSessionStatus.BOT, ChatSessionStatus.PENDING_HUMAN, ChatSessionStatus.HUMAN],
      default: ChatSessionStatus.BOT,
      required: true,
    },
    driftCount: {
      type: Number,
      default: 0,
      required: true,
    },
    assignedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },
    contactName: {
      type: String,
      default: null,
    },
    extractedData: {
      type: extractedDataSchema,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    historicalSummary: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatSessionModel =
  mongoose.models.ChatSession ||
  mongoose.model<IChatSessionDocument>("ChatSession", chatSessionSchema);

export default ChatSessionModel;
