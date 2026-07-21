import { Message } from "./types";

const MOCK_REPLIES: Record<string, string> = {
  "1": "You are welcome! I am ready to process more stock inquiries or generate purchase reports.",
  "2": "Of course. I will be monitoring the revenue and predictive sales analysis.",
  "3": "Received. All systems are optimal and secure.",
};

const MOCK_AUDIO_REPLY = `🎙️ *Audio Transcription:* 'Which products have critical stock in my inventory?'\n\n*Gemini Copilot AI Response:* Analyzing the inventory database in real-time... You currently have 3 products requiring urgent stock attention:\n- **Portland Cement (x50)**: Current stock: 12 units (minimum: 30).\n- **Deformed Steel Bar (x100)**: Current stock: 24 units (minimum: 100).\n- **White Latex Paint**: Current stock: 8 units (minimum: 20).\n\nWould you like me to prepare a purchase draft to replenish them?`;

const MOCK_IMAGE_REPLY = `🖼️ *AI Vision Analysis:* I have successfully processed the image. Reduced stock is registered on the warehouse shelf. I recommend initiating an automated purchase process.\n\nWould you like me to prepare a draft purchase order to validate replenishment?`;

const MOCK_DEFAULT_REPLY = "Thank you very much for the support! I will be validating it.";

const formatTime = (): string =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const resolveReplyText = (contactId: string, hasAudio: boolean, hasImage: boolean): string => {
  if (hasAudio) return MOCK_AUDIO_REPLY;
  if (hasImage) return MOCK_IMAGE_REPLY;
  return MOCK_REPLIES[contactId] ?? MOCK_DEFAULT_REPLY;
};

export interface SendMockReplyInput {
  contactId: string;
  text: string;
  audio: { name: string; duration: string } | null;
  image: string | null;
}

export interface MockReplyOutcome {
  newMessage: Message;
  replyMessage: Message;
  contactPreview: { lastMessage: string; time: string };
  replyPreview: { lastMessage: string; time: string };
}

export const buildMockReply = ({
  contactId,
  text,
  audio,
  image,
}: SendMockReplyInput): MockReplyOutcome => {
  const isAudioMessage = !!audio;
  const isImageMessage = !!image;
  const time = formatTime();

  const newMessage: Message = {
    id: `${contactId}_${Date.now()}`,
    text: isAudioMessage || isImageMessage ? "" : text.trim(),
    sender: "agent",
    time,
    ...(isAudioMessage ? { audio } : {}),
    ...(isImageMessage ? { image } : {}),
  };

  const replyText = resolveReplyText(contactId, isAudioMessage, isImageMessage);
  const replyMessage: Message = {
    id: `${contactId}_reply_${Date.now()}`,
    text: replyText,
    sender: "client",
    time: formatTime(),
  };

  const contactPreview = {
    lastMessage: isAudioMessage
      ? "🎤 Voice note"
      : isImageMessage
        ? "🖼️ Image"
        : text.trim(),
    time: "Just now",
  };

  const replyPreview = {
    lastMessage: isAudioMessage ? "Copilot Response" : replyText,
    time: "Just now",
  };

  return { newMessage, replyMessage, contactPreview, replyPreview };
};

export const buildStickerMessage = (_contactId: string): Message => ({
  id: `sticker_${Date.now()}`,
  text: "",
  sender: "agent",
  time: formatTime(),
  sticker: "brain",
});

export const MOCK_REPLY_DELAY_MS = 1500;
