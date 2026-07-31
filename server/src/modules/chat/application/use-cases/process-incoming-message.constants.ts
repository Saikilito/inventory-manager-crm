export const ChatSessionTag = {
  OrderCompleted: "ORDER COMPLETED",
  Cancelled: "CANCELLED",
} as const;

export type ChatSessionTag = (typeof ChatSessionTag)[keyof typeof ChatSessionTag];

export const MAX_INCOMING_MESSAGE_LENGTH = 2000;

export const MAX_REPLY_WORDS = 50;

export const UNSUPPORTED_MEDIA_MESSAGES = {
  AUDIO: "Actualmente no puedo procesar notas de voz ni audios. Te he transferido con un operador humano para que te atienda a la brevedad.",
  IMAGE: "Actualmente no puedo procesar imágenes. Te he transferido con un operador humano para que te atienda a la brevedad.",
} as const;
