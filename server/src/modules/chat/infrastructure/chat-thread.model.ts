import mongoose, { Schema, Document } from "mongoose";
import { ChatMessageSender } from "../application/repositories/chat-message.repository.js";
import { ChatThreadStatus } from "../application/repositories/chat-thread-status.js";

export interface IChatMessageSubDocument {
  _id?: mongoose.Types.ObjectId;
  text: string;
  sender: ChatMessageSender;
  isPrivate: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatThreadDocument extends Document {
  _id: mongoose.Types.ObjectId;
  whatsappId: string;
  dateStr: string; // YYYY-MM-DD
  status: ChatThreadStatus;
  messages: IChatMessageSubDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSubSchema = new Schema<IChatMessageSubDocument>(
  {
    text: { type: String, required: true },
    sender: {
      type: String,
      enum: [ChatMessageSender.CUSTOMER, ChatMessageSender.BOT, ChatMessageSender.AGENT, ChatMessageSender.CRM_OPERATOR],
      required: true,
    },
    isPrivate: { type: Boolean, default: false, required: true },
    createdBy: { type: String },
    updatedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: true }
);

const chatThreadSchema = new Schema<IChatThreadDocument>(
  {
    whatsappId: { type: String, required: true, index: true },
    dateStr: { type: String, required: true },
    status: {
      type: String,
      enum: [ChatThreadStatus.ACTIVE, ChatThreadStatus.ARCHIVED],
      default: ChatThreadStatus.ACTIVE,
      required: true,
    },
    messages: { type: [chatMessageSubSchema], default: [] },
  },
  { timestamps: true }
);

// Compound index for unique daily thread per whatsappId
chatThreadSchema.index({ whatsappId: 1, dateStr: 1 }, { unique: true });

export const ChatThreadModel =
  (mongoose.models.ChatThread as mongoose.Model<IChatThreadDocument>) ||
  mongoose.model<IChatThreadDocument>("ChatThread", chatThreadSchema);

export default ChatThreadModel;
