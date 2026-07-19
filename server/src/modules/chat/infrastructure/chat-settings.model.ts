import mongoose, { Schema, Document } from "mongoose";

export interface IChatSettings {
  pagoMovilBank: string;
  pagoMovilPhone: string;
  pagoMovilId: string;
  whatsappOriginLatitude: number;
  whatsappOriginLongitude: number;
  whatsappAlertGroupJid: string;
  systemPrompt: string;
  binancePayUser: string;
}

export interface IChatSettingsDocument extends Document, IChatSettings {}

const chatSettingsSchema = new Schema<IChatSettingsDocument>({
  pagoMovilBank: { type: String, required: true },
  pagoMovilPhone: { type: String, required: true },
  pagoMovilId: { type: String, required: true },
  whatsappOriginLatitude: { type: Number, required: true },
  whatsappOriginLongitude: { type: Number, required: true },
  whatsappAlertGroupJid: { type: String, required: true },
  systemPrompt: { type: String, required: true },
  binancePayUser: { type: String, required: true },
});

export const ChatSettingsModel =
  (mongoose.models.ChatSettings as mongoose.Model<IChatSettingsDocument>) ||
  mongoose.model<IChatSettingsDocument>("ChatSettings", chatSettingsSchema);

export default ChatSettingsModel;
