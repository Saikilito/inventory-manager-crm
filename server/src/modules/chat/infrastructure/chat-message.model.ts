import mongoose, { Schema, Document } from "mongoose";
import { ChatMessageSender } from "../application/repositories/chat-message.repository.js";

export interface IChatMessageDocument extends Document {
  _id: mongoose.Types.ObjectId;
  whatsappId: string;
  text: string;
  sender: ChatMessageSender;
  isPrivate: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    whatsappId: { type: String, required: true },
    text: { type: String, required: true },
    sender: { type: String, enum: [ChatMessageSender.CUSTOMER, ChatMessageSender.BOT, ChatMessageSender.AGENT, ChatMessageSender.CRM_OPERATOR], required: true },
    isPrivate: { type: Boolean, default: false, required: true },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// Compound index for chronological message retrieval per chat
chatMessageSchema.index({ whatsappId: 1, createdAt: 1 });

export const ChatMessageModel =
  (mongoose.models.ChatMessage as mongoose.Model<IChatMessageDocument>) ||
  mongoose.model<IChatMessageDocument>("ChatMessage", chatMessageSchema);

export default ChatMessageModel;
